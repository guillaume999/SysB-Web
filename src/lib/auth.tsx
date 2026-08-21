import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { pb } from "@/lib/pb";

/**
 * L'admin SysB s'authentifie en **superuser PocketBase** : depuis le retrait du
 * champ `role` (2026-08-21), les collections de contenu sont en écriture
 * superuser-only, donc c'est le seul compte capable d'écrire config / fiches /
 * templates / productions / evolutions.
 */
type Superuser = { id: string; email?: string; collectionName?: string } & Record<string, unknown>;

interface AuthContextValue {
  user: Superuser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readUser(): Superuser | null {
  if (!pb.authStore.isValid) return null;
  const record = pb.authStore.record as Superuser | null;
  // On refuse une session utilisateur "joueur" : elle n'a aucun droit d'écriture ici.
  if (record?.collectionName !== "_superusers") return null;
  return record;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Superuser | null>(readUser());
  const [loading, setLoading] = useState<boolean>(pb.authStore.isValid);

  useEffect(() => pb.authStore.onChange(() => setUser(readUser())), []);

  // Au montage : si un token traîne en localStorage, on le valide côté serveur.
  // Un token expiré vide la session au lieu de laisser une UI qui échoue partout.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!pb.authStore.isValid) {
        setLoading(false);
        return;
      }
      try {
        await pb.collection("_superusers").authRefresh();
      } catch {
        pb.authStore.clear();
      } finally {
        if (!cancelled) {
          setUser(readUser());
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn: async (email, password) => {
        try {
          await pb.collection("_superusers").authWithPassword(email, password);
          setUser(readUser());
          return { error: null };
        } catch (e) {
          const err = e as { status?: number; message?: string };
          const message =
            err.status === 400
              ? "Identifiants superuser invalides."
              : err.message || "Connexion impossible.";
          return { error: new Error(message) };
        }
      },
      signOut: () => {
        pb.authStore.clear();
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}
