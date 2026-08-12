import { createFileRoute } from "@tanstack/react-router";
import { Facebook, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "À propos — Smart Stage" },
      {
        name: "description",
        content:
          "Présentation de l'entreprise derrière Smart Stage : mission, adresse, téléphone, e-mail RH et réseaux sociaux.",
      },
      { property: "og:title", content: "À propos de Smart Stage" },
      {
        property: "og:description",
        content: "Qui nous sommes et comment contacter le service RH de Smart Stage.",
      },
    ],
  }),
  component: About,
});

const contacts = [
  {
    icon: MapPin,
    label: "Adresse",
    value: "Zone Industrielle Messadine, Route de M'Saken, 4013 Messadine, Sousse",
  },
  { icon: Phone, label: "Téléphone", value: "+216 73 102 000" },
  { icon: Mail, label: "E-mail RH", value: "rh@smartstage.tn" },
  { icon: Facebook, label: "Facebook", value: "facebook.com/smartstage" },
  { icon: Linkedin, label: "LinkedIn", value: "linkedin.com/company/smartstage" },
];

function About() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="bg-card py-14">
          <div className="mx-auto max-w-6xl px-4">
            <h1 className="text-3xl font-bold md:text-4xl">À propos de Smart Stage</h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Smart Stage est né d'un constat simple : le suivi des stages repose encore trop souvent
              sur des fichiers Excel et des e-mails. Notre équipe conçoit des outils internes qui
              rendent le travail des services RH et des encadrants plus lisible et plus rapide.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Notre mission</h2>
            <p className="text-sm text-muted-foreground">
              Offrir une plateforme unique où le RH gère les comptes et les affectations, où
              l'encadrant programme et suit les tâches, et où le stagiaire visualise clairement son
              travail et sa progression.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "12", label: "Stagiaires suivis" },
                { value: "4", label: "Départements" },
                { value: "96", label: "Tâches gérées" },
              ].map((s) => (
                <div key={s.label} className="surface-card p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{s.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-6">
            <h2 className="text-xl font-bold">Nous contacter</h2>
            <ul className="mt-5 space-y-4">
              {contacts.map((c) => (
                <li key={c.label} className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                    <c.icon className="size-4" />
                  </span>
                  <span>
                    <span className="block text-xs uppercase tracking-wide text-muted-foreground">
                      {c.label}
                    </span>
                    <span className="text-sm font-medium">{c.value}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="mb-4 text-2xl font-bold">Nous trouver</h2>
          <div className="overflow-hidden rounded-xl border border-border shadow-card">
            <iframe
              title="Localisation de Smart Stage sur Google Maps"
              src="https://www.google.com/maps?q=LEONI+Wiring+Systems+Tunisia+Messadine+Sousse&output=embed"
              className="h-80 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}