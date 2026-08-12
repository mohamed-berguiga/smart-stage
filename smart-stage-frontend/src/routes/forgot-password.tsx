import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, Mail } from "lucide-react";
import { api, ApiError } from "@/lib/api";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [{ title: "Mot de passe oublié — Smart Stage" }],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
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

        <h1 className="text-2xl font-bold">Mot de passe oublié</h1>

        {sent ? (
          <div className="mt-4 space-y-4">
            <p className="rounded-lg border border-success/30 bg-success/10 px-3 py-3 text-sm text-success">
              Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.
              Vérifiez votre boîte de réception (et vos spams).
            </p>
            <Link to="/login" className="text-sm font-medium text-primary hover:underline">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              Entrez votre email, on vous envoie un lien pour choisir un nouveau mot de passe.
            </p>

            {error && (
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium">
                E-mail
                <span className="mt-1 flex items-center gap-2 rounded-lg border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
                  <Mail className="size-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    className="w-full bg-transparent py-2.5 text-sm outline-none"
                  />
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {loading ? "Envoi en cours..." : "Envoyer le lien"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link to="/login" className="font-medium text-primary">
                Retour à la connexion
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}