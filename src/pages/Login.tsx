import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { PB_URL } from "@/lib/pb";

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { error: signInError } = await signIn(email, password);
    if (signInError) setError(signInError.message);
    setBusy(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm p-6">
        <h1 className="text-xl font-semibold text-white">SysB — administration</h1>
        <p className="mt-1 text-sm text-slate-400">
          Connexion avec un compte <strong className="text-slate-300">superuser</strong> PocketBase.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded border border-red-900/60 bg-red-950/40 p-2 text-sm text-red-300">{error}</p>
        )}

        <button type="submit" className="btn-primary mt-6 w-full" disabled={busy}>
          {busy ? "Connexion…" : "Se connecter"}
        </button>

        <p className="mt-4 text-center text-xs text-slate-600">{PB_URL}</p>
      </form>
    </div>
  );
}
