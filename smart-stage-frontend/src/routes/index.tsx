import { Link, createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  CheckCircle2,
  ClipboardList,
  FileText,
  MessagesSquare,
  ShieldCheck,
  Users,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Stage — Gestion et suivi des stages en entreprise" },
      {
        name: "description",
        content:
          "Smart Stage centralise la gestion des stagiaires, l'affectation aux encadrants, le suivi des tâches et les rapports hebdomadaires.",
      },
      { property: "og:title", content: "Smart Stage — Optimizing Internship Management" },
      {
        property: "og:description",
        content:
          "Plateforme web pour gérer stagiaires, encadrants, tâches, rapports et tableaux de bord Power BI.",
      },
    ],
  }),
  component: Home,
});

const features = [
  { icon: Users, title: "Stagiaires & encadrants", text: "Comptes, départements et affectations gérés par le RH depuis un seul écran." },
  { icon: ClipboardList, title: "Tâches et priorités", text: "Création, échéances, priorités et statuts : à faire, en cours, terminée, en retard." },
  { icon: MessagesSquare, title: "Collaboration", text: "Commentaires, réponses et pièces jointes directement sur chaque tâche." },
  { icon: Bell, title: "Notifications", text: "Nouvelle tâche, changement de statut, commentaire ou échéance proche." },
  { icon: FileText, title: "Rapports automatiques", text: "Un rapport hebdomadaire généré pour chaque stagiaire avec sa progression." },
  { icon: BarChart3, title: "Analyse Power BI", text: "Tâches par stagiaire, par encadrant, par département et évolution hebdomadaire." },
];

const benefits = [
  "Fini les fichiers Excel et les échanges d'e-mails dispersés",
  "Une seule source de vérité pour le suivi des stages",
  "Visibilité immédiate sur l'avancement et les retards",
  "Rôles séparés : RH, encadrant et stagiaire",
];

function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="gradient-brand text-primary-foreground">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-2 md:py-28">
            <div>
              <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                Optimizing Internship Management
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">
                Smart Stage, la plateforme de gestion des stages
              </h1>
              <p className="mt-5 max-w-lg text-base opacity-90">
                Centralisez la gestion des stagiaires et des encadrants, programmez les tâches,
                suivez l'avancement et générez automatiquement les rapports hebdomadaires.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className="rounded-lg bg-card px-5 py-3 text-sm font-semibold text-primary shadow-elevated transition-transform hover:-translate-y-0.5"
                >
                  Se connecter
                </Link>
                <Link
                  to="/dashboard"
                  className="rounded-lg border border-white/40 px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/10"
                >
                  Ouvrir mon espace
                </Link>

              </div>
            </div>

            <div className="surface-card space-y-4 p-6 text-card-foreground">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Rapport semaine 3</p>
                <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
                  75 % de progression
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Stagiaire : Ahmed Mohamed — Département IT</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Total tâches", value: "12", tone: "text-primary" },
                  { label: "Terminées", value: "8", tone: "text-success" },
                  { label: "En cours", value: "3", tone: "text-warning" },
                  { label: "En retard", value: "1", tone: "text-destructive" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className={`text-2xl font-bold ${item.tone}`}>{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-3/4 rounded-full bg-success" />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold">Ce que fait Smart Stage</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Huit modules couvrant l'ensemble du cycle de vie d'un stage, de la création du compte au
            rapport final.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <article key={f.title} className="surface-card p-5">
                <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-card py-16">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold">Avantages</h2>
              <ul className="mt-6 space-y-3">
                {benefits.map((b) => (
                  <li key={b} className="flex gap-3 text-sm">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Trois rôles, trois espaces séparés</h2>
              <div className="mt-6 space-y-3">
                {[
                  { role: "RH", text: "Vue globale, comptes, journal de l'entreprise et statistiques Power BI." },
                  { role: "Encadrant", text: "Ses stagiaires, création et validation des tâches, journal du département." },
                  { role: "Stagiaire", text: "Ses tâches, son journal quotidien et son rapport hebdomadaire." },
                ].map((item) => (
                  <Link
                    key={item.role}
                    to="/login"
                    className="surface-card flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted"
                  >
                    <span>
                      <span className="flex items-center gap-2 font-semibold">
                        <ShieldCheck className="size-4 text-primary" />
                        {item.role}
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">{item.text}</span>
                    </span>
                    <span className="text-sm font-medium text-primary">Se connecter</span>
                  </Link>
                ))}
              </div>

            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
