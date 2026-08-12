import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, Lock } from "lucide-react";
import { api, ApiError } from "@/lib/api";

export const Route = createFileRoute("/reset-password/$token")({
  head: () => ({
    meta: [{ title: "Réinitialiser le mot de passe — Smart Stage" }],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
      setTimeout(() => navigate({ to: "/login" }), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="surface-card w-full max-w-md p-8">
        <Link to="/" className="mb-6 flex items-center gap-2 text-lg font-bold text-primary">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          Smart Stage
        </Link>

        <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>

        {success ? (
          <p className="mt-4 rounded-lg border border-success/30 bg-success/10 px-3 py-3 text-sm text-success">
            Mot de passe réinitialisé ! Redirection vers la connexion...
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted-foreground">Choisissez votre nouveau mot de passe.</p>

            {error && (
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium">
                Nouveau mot de passe
                <span className="mt-1 flex items-center gap-2 rounded-lg border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
                  <Lock className="size-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent py-2.5 text-sm outline-none"
                  />
                </span>
              </label>

              <label className="block text-sm font-medium">
                Confirmer le mot de passe
                <span className="mt-1 flex items-center gap-2 rounded-lg border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
                  <Lock className="size-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent py-2.5 text-sm outline-none"
                  />
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {loading ? "Enregistrement..." : "Réinitialiser le mot de passe"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}