import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { pb } from "@/lib/pb";

/**
 * Le site s'authentifie avec un **compte joueur PocketBase dont `role = "admin"`**
 * (collection `users`), pas avec le superuser : le superuser reste réservé à
 * l'admin PocketBase brut sur pb-sysb.physiooffice.com/_/.
 *
 * Les règles d'API de `config`, `fiches`, `templates`, `productions` et
 * `evolutions` autorisent create/update/delete pour `@request.auth.role = 'admin'`.
 */
export type Role = "player" | "admin" | "tester";

export type AdminUser = {
  id: string;
  email?: string;
  pseudo?: string;
  role?: Role;
  collectionName?: string;
} & Record<string, unknown>;

interface AuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => void;
}

const NOT_ADMIN =
  "Ce compte n'a pas le rôle admin. Demande à un administrateur de te l'attribuer dans PocketBase.";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readUser(): AdminUser | null {
  if (!pb.authStore.isValid) return null;
  const record = pb.authStore.record as AdminUser | null;
  // Seuls les comptes `users` avec le rôle admin ouvrent l'interface :
  // une session superuser ou un compte joueur ordinaire n'y donne pas accès.
  if (!record || record.collectionName !== "users" || record.role !== "admin") return null;
  return record;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(readUser());
  const [loading, setLoading] = useState<boolean>(pb.authStore.isValid);

  useEffect(() => pb.authStore.onChange(() => setUser(readUser())), []);

  // Au montage : un token en localStorage est revalidé côté serveur, ce qui
  // rafraîchit aussi le rôle (un admin rétrogradé perd l'accès au rechargement).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!pb.authStore.isValid) {
        setLoading(false);
        return;
      }
      try {
        await pb.collection("users").authRefresh();
        if (!readUser()) pb.authStore.clear();
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
          const auth = await pb.collection("users").authWithPassword(email, password);
          if ((auth.record as AdminUser)?.role !== "admin") {
            pb.authStore.clear();
            return { error: new Error(NOT_ADMIN) };
          }
          setUser(readUser());
          return { error: null };
        } catch (e) {
          const err = e as { status?: number; message?: string };
          const message =
            err.status === 400
              ? "Email ou mot de passe incorrect."
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
