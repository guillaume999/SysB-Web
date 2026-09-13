import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { pb } from "@/lib/pb";
import { roleEstAdmin } from "@/lib/acces";

/**
 * Le site s'authentifie avec un **compte de la collection `users`**, pas avec
 * le superuser : le superuser reste réservé à l'admin PocketBase brut sur
 * pb-sysb.physiooffice.com/_/.
 *
 * ⚠️ CHANGEMENT DU 2026-09-13 : **tout compte `users` peut se connecter**, plus
 * seulement `role = "admin"`. Avant, un joueur était rejeté dès `signIn` avec
 * « ce compte n'a pas le rôle admin » ; il entre désormais et voit l'onglet
 * Conception, et rien d'autre.
 *
 * Le rôle ne décide donc plus de l'ENTRÉE, il décide des ÉCRANS — voir
 * `lib/acces.ts`, seul endroit où ce partage est écrit. Les règles d'API de
 * `tuiles`, `ressources`, `templates`… gardent, elles, leur
 * `@request.auth.role = 'admin'` en écriture : c'est ça qui protège les
 * données, pas la barre latérale.
 */
export type Role = "player" | "admin" | "tester";

export type CompteUser = {
  id: string;
  email?: string;
  pseudo?: string;
  role?: Role;
  collectionName?: string;
} & Record<string, unknown>;

interface AuthContextValue {
  user: CompteUser | null;
  /** Le compte connecté ouvre-t-il les écrans de contenu ? */
  estAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readUser(): CompteUser | null {
  if (!pb.authStore.isValid) return null;
  const record = pb.authStore.record as CompteUser | null;
  // ⚠️ La collection reste vérifiée : une session **superuser** traîne dans le
  // même `localStorage` (l'admin PocketBase est sur le même domaine), et elle
  // ignore toutes les règles d'API. Elle n'ouvre pas ce site.
  if (!record || record.collectionName !== "users") return null;
  return record;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CompteUser | null>(readUser());
  const [loading, setLoading] = useState<boolean>(pb.authStore.isValid);

  useEffect(() => pb.authStore.onChange(() => setUser(readUser())), []);

  // Au montage : un token en localStorage est revalidé côté serveur, ce qui
  // rafraîchit aussi le rôle — un admin rétrogradé perd les écrans de contenu
  // au rechargement, et se retrouve sur la Conception.
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
      estAdmin: roleEstAdmin(user?.role),
      loading,
      signIn: async (email, password) => {
        try {
          await pb.collection("users").authWithPassword(email, password);
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
