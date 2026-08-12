import { Link, Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  LogOut,
  PieChart,
  Target,
  UserCog,
} from "lucide-react";
import { logout, useSession, type Role } from "@/lib/session";
import { AppDataProvider } from "@/lib/store";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

const links = [
  { to: "/dashboard", label: "Aperçu", icon: LayoutDashboard },
  { to: "/dashboard/taches", label: "Suivi des tâches", icon: ListChecks },
  { to: "/dashboard/competences", label: "Compétences", icon: Target },
  { to: "/dashboard/journal", label: "Journal", icon: BookOpen },
  { to: "/dashboard/rapports", label: "Rapports & statistiques", icon: PieChart },
  { to: "/dashboard/profil", label: "Mon profil", icon: UserCog },
] as const;

// Libellés d'affichage par rôle (ne viennent pas du backend, juste du texte UI).
// Les infos propres à l'utilisateur (nom, département...) viennent, elles, de useSession().
const roleLabels: Record<Role, { label: string; space: string }> = {
  RH: { label: "RH", space: "Espace RH" },
  ENCADRANT: { label: "Encadrant", space: "Espace Encadrant" },
  STAGIAIRE: { label: "Stagiaire", space: "Espace Stagiaire" },
};

function DashboardLayout() {
  const navigate = useNavigate();
  const { user, role, ready } = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = [...links].reverse().find((l) => pathname.startsWith(l.to));

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login", replace: true });
  }, [ready, user, navigate]);

  if (!user || !role) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Vérification de la session…
      </div>
    );
  }

  const meta = roleLabels[role];
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <AppDataProvider>
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col bg-sidebar text-sidebar-foreground md:flex">
          <Link to="/" className="flex items-center gap-2 px-5 py-5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            <span className="font-bold">Smart Stage</span>
          </Link>

          <div className="mx-3 mb-3 rounded-lg bg-sidebar-accent/50 p-3 text-sm">
            <p className="font-semibold">{fullName}</p>
            <p className="text-xs opacity-75">{meta.label}</p>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-2 text-sm">
            <p className="px-2 pb-2 text-xs uppercase tracking-wider opacity-60">{meta.space}</p>
            {links.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/dashboard" }}
                activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                inactiveProps={{ className: "opacity-80 hover:bg-sidebar-accent/60" }}
                className="flex items-center gap-2 rounded-md px-3 py-2 transition-colors"
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-sidebar-border p-3">
            <Link
              to="/login"
              onClick={() => logout()}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm opacity-80 transition-colors hover:bg-sidebar-accent/60"
            >
              <LogOut className="size-4" />
              Déconnexion
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-card px-4 md:px-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <LayoutDashboard className="size-4 text-primary" />
              {current?.label ?? "Aperçu"}
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <NotificationBell />
              <span className="hidden text-sm text-muted-foreground sm:block">
                {fullName} · {meta.label}
              </span>
            </div>
          </header>

          <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-4 py-2 text-sm md:hidden">
            {links.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/dashboard" }}
                activeProps={{ className: "bg-secondary text-secondary-foreground" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="whitespace-nowrap rounded-md px-3 py-1.5"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </AppDataProvider>
  );
}