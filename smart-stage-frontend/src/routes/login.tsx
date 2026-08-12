import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, Lock, Mail } from "lucide-react";
import { login, ApiError } from "@/lib/session";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion — Smart Stage" },
      {
        name: "description",
        content: "Connectez-vous à Smart Stage selon votre rôle : RH, encadrant ou stagiaire.",
      },
      { property: "og:title", content: "Connexion à Smart Stage" },
      { property: "og:description", content: "Accès à votre espace RH, encadrant ou stagiaire." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // login() appelle POST /api/auth/login, stocke le token + l'utilisateur,
      // et renvoie l'utilisateur connecté (avec son vrai rôle : RH / ENCADRANT / STAGIAIRE).
      await login(email, password);
      navigate({ to: "/dashboard" });
    } catch (err) {
      if (err instanceof ApiError) {
        // Messages renvoyés tels quels par le backend, ex. "Identifiants incorrects"
        // ou "Ce compte a été désactivé. Contactez le RH."
        setError(err.message);
      } else {
        setError("Impossible de contacter le serveur. Vérifiez que le backend tourne bien.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="gradient-brand hidden flex-col justify-between p-12 text-primary-foreground lg:flex">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/15">
            <GraduationCap className="size-5" />
          </span>
          Smart Stage
        </Link>
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            Le suivi des stages, enfin au même endroit.
          </h2>
          <p className="mt-4 max-w-md opacity-85">
            Tâches, commentaires, notifications et rapports hebdomadaires pour chaque stagiaire.
          </p>
        </div>
        <p className="text-sm opacity-70">Optimizing Internship Management</p>
      </div>

      <div className="flex items-center justify-center bg-background p-6">
        <div className="surface-card w-full max-w-md p-8">
          <h1 className="text-2xl font-bold">Connexion</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Chaque compte ouvre uniquement son propre espace, selon son rôle.
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
                  placeholder="rh@smartstage.com"
                  className="w-full bg-transparent py-2.5 text-sm outline-none"
                />
              </span>
            </label>

            <label className="block text-sm font-medium">
              Mot de passe
              <span className="mt-1 flex items-center gap-2 rounded-lg border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
                <Lock className="size-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent py-2.5 text-sm outline-none"
                />
              </span>
            </label>

            <div className="text-right">
              <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/" className="font-medium text-primary">
              Retour à l'accueil
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}