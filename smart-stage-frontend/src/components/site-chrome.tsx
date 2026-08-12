import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const nav = [
  { to: "/", label: "Accueil" },
  { to: "/about", label: "À propos" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="gradient-brand flex size-9 items-center justify-center rounded-lg text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          <span className="text-lg font-bold">Smart Stage</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm font-medium">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: true }}
              activeProps={{ className: "bg-secondary text-secondary-foreground" }}
              inactiveProps={{ className: "text-muted-foreground hover:bg-muted" }}
              className="rounded-md px-3 py-2 transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
          <Link
            to="/login"
            className="ml-2 rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Connexion
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-brand-dark text-brand-dark-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <p className="text-lg font-bold">Smart Stage</p>
          <p className="mt-2 text-sm opacity-80">
            Optimizing Internship Management — plateforme de gestion et de suivi des stages.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Navigation</p>
          <ul className="mt-3 space-y-2 opacity-80">
            <li><Link to="/">Accueil</Link></li>
            <li><Link to="/about">À propos</Link></li>
            <li><Link to="/login">Connexion</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Contact RH</p>
          <ul className="mt-3 space-y-2 opacity-80">
            <li>rh@smartstage.tn</li>
            <li>+216 73 102 000</li>
            <li>Zone Industrielle Messadine, Route de M'Saken, 4013 Messadine, Sousse</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs opacity-70">
        © {new Date().getFullYear()} Smart Stage. Tous droits réservés.
      </div>
    </footer>
  );
}