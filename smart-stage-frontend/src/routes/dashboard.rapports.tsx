import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { BarRow, Panel, StatCard } from "@/components/dashboard-ui";
import { PrimaryButton } from "@/components/form-ui";
import { useSession } from "@/lib/session";
import { useStore, type Account } from "@/lib/store";
import type { Task } from "@/lib/demo-data";
import { api, ApiError } from "@/lib/api";

export const Route = createFileRoute("/dashboard/rapports")({
  head: () => ({
    meta: [
      { title: "Rapports & statistiques — Smart Stage" },
      {
        name: "description",
        content:
          "Rapports hebdomadaires et statistiques de stage : progression, répartition des tâches et indicateurs Power BI.",
      },
      { property: "og:title", content: "Rapports & statistiques — Smart Stage" },
      { property: "og:description", content: "Progression, répartition des tâches et indicateurs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportsPage,
});

type InternRow = { id: string; name: string };

/** Découpe les 4 dernières semaines glissantes (S1 = il y a 3 semaines, S4 = cette semaine). */
function weekBuckets() {
  const now = new Date();
  const buckets: { label: string; start: Date; end: Date }[] = [];
  for (let i = 3; i >= 0; i -= 1) {
    const end = new Date(now);
    end.setDate(now.getDate() - i * 7);
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    buckets.push({ label: `S${4 - i}`, start, end });
  }
  return buckets;
}

/** Nombre de tâches terminées par semaine, à partir de leur date de création. */
function weeklyDone(tasks: Task[]) {
  return weekBuckets().map((b) => ({
    week: b.label,
    done: tasks.filter((t) => {
      if (t.status !== "Terminée" || !t.createdAt) return false;
      const d = new Date(t.createdAt);
      return d >= b.start && d <= b.end;
    }).length,
  }));
}

function ReportsPage() {
  const { user, role } = useSession();
  const { tasks, accounts, departments, fullName, myStagiaires } = useStore();
  const [downloading, setDownloading] = useState(false);

  if (!user || !role) return null;
  const selfName = `${user.firstName} ${user.lastName}`;

  // ⚠️ "accounts" n'est peuplé que pour le rôle RH (par design, voir store.tsx).
  // Pour un encadrant, on utilise "myStagiaires" (déjà réel, via /users/my-stagiaires).
  const internRows: InternRow[] =
    role === "RH"
      ? accounts.filter((a) => a.role === "stagiaire").map((a) => ({ id: a.id, name: fullName(a) }))
      : role === "ENCADRANT"
        ? myStagiaires
        : [];

  // Utilisé uniquement dans le bloc RH ci-dessous (comptes complets avec département/statut actif).
  const rhInternAccounts: Account[] = role === "RH" ? accounts.filter((a) => a.role === "stagiaire") : [];

  const perIntern = internRows.map((i) => {
    const mine = tasks.filter((t) => t.assignedTo === i.name);
    return {
      id: i.id,
      name: i.name,
      total: mine.length,
      done: mine.filter((t) => t.status === "Terminée").length,
    };
  });
  const maxIntern = Math.max(...perIntern.map((i) => i.total), 1);

  const weekly = weeklyDone(tasks);
  const maxWeekly = Math.max(...weekly.map((w) => w.done), 1);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      let payload: {
        title: string;
        subtitle?: string | undefined;
        stats: { label: string; value: string }[];
        rows?: { label: string; value: string }[] | undefined;
        weekly: { week: string; done: number }[];
      };

      if (role === "STAGIAIRE") {
        const total = tasks.length;
        const done = tasks.filter((t) => t.status === "Terminée").length;
        const inProgress = tasks.filter((t) => t.status === "En cours").length;
        const late = tasks.filter((t) => t.status === "En retard").length;
        payload = {
          title: `Mon rapport — ${selfName}`,
          subtitle: user.department ? `Département ${user.department.name}` : undefined,
          stats: [
            { label: "Total tâches", value: String(total) },
            { label: "Terminées", value: String(done) },
            { label: "En cours", value: String(inProgress) },
            { label: "En retard", value: String(late) },
          ],
          weekly,
        };
      } else if (role === "ENCADRANT") {
        const doneTotal = perIntern.reduce((s, i) => s + i.done, 0);
        const avgProgress = perIntern.length
          ? Math.round(
              perIntern.reduce((s, i) => s + (i.total ? (i.done / i.total) * 100 : 0), 0) / perIntern.length,
            )
          : 0;
        payload = {
          title: `Rapport — Mes stagiaires (${selfName})`,
          stats: [
            { label: "Stagiaires suivis", value: String(perIntern.length) },
            { label: "Tâches terminées", value: String(doneTotal) },
            { label: "Progression moyenne", value: `${avgProgress} %` },
          ],
          rows: perIntern.map((i) => ({ label: i.name, value: `${i.done}/${i.total} tâches` })),
          weekly,
        };
      } else {
        const total = tasks.length;
        const done = tasks.filter((t) => t.status === "Terminée").length;
        const late = tasks.filter((t) => t.status === "En retard").length;
        const rate = total ? Math.round((done / total) * 100) : 0;
        payload = {
          title: "Rapport global — Smart Stage",
          stats: [
            { label: "Stagiaires actifs", value: String(rhInternAccounts.filter((a) => a.active).length) },
            { label: "Tâches créées", value: String(total) },
            { label: "Taux de réalisation", value: `${rate} %` },
            { label: "Tâches en retard", value: String(late) },
          ],
          rows: perIntern.map((i) => ({ label: i.name, value: `${i.done}/${i.total} tâches` })),
          weekly,
        };
      }

      const { fileUrl } = await api.post<{ fileUrl: string }>("/reports/pdf", payload);
      window.open(api.fileUrl(fileUrl), "_blank", "noopener");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur lors de la génération du PDF");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Rapports & statistiques</h1>
        <PrimaryButton onClick={() => void downloadPdf()} disabled={downloading}>
          <span className="inline-flex items-center gap-1.5">
            <Download className="size-4" />
            {downloading ? "Génération..." : "Télécharger en PDF"}
          </span>
        </PrimaryButton>
      </div>

      {role === "STAGIAIRE" ? (
        <>
          <Panel
            title="Mon rapport"
            description={`${selfName}${user.department ? ` · Département ${user.department.name}` : ""}`}
          >
            <StagiaireSummary tasks={tasks} />
          </Panel>
          <Panel title="Mon évolution hebdomadaire" description="Tâches terminées par semaine">
            <WeeklyChart data={weekly} max={maxWeekly} />
          </Panel>
        </>
      ) : null}

      {role === "ENCADRANT" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Stagiaires suivis" value={String(perIntern.length)} />
            <StatCard
              label="Tâches terminées"
              value={String(perIntern.reduce((s, i) => s + i.done, 0))}
              tone="success"
            />
            <StatCard
              label="Progression moyenne"
              value={`${
                perIntern.length
                  ? Math.round(
                      perIntern.reduce((s, i) => s + (i.total ? (i.done / i.total) * 100 : 0), 0) /
                        perIntern.length,
                    )
                  : 0
              } %`}
              tone="warning"
            />
          </div>
          <Panel title="Tâches par stagiaire" description="Mon équipe">
            <div className="space-y-3">
              {perIntern.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun stagiaire affecté.</p>
              ) : (
                perIntern.map((i) => <BarRow key={i.id} label={i.name} value={i.total} max={maxIntern} />)
              )}
            </div>
          </Panel>
          <Panel title="Évolution hebdomadaire" description="Tâches terminées par semaine">
            <WeeklyChart data={weekly} max={maxWeekly} />
          </Panel>
        </>
      ) : null}

      {role === "RH" ? (
        <>
          <RhStats tasks={tasks} accounts={rhInternAccounts} />
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Tâches par stagiaire" description="Vue globale">
              <div className="space-y-3">
                {perIntern.map((i) => (
                  <BarRow key={i.id} label={i.name} value={i.total} max={maxIntern} />
                ))}
              </div>
            </Panel>
            <Panel title="Tâches par département" description="Vue globale">
              <DeptBars
                departments={departments}
                accounts={rhInternAccounts}
                tasks={tasks}
                fullName={fullName}
              />
            </Panel>
            <Panel title="État des tâches" description="Répartition par statut">
              <StatusBars tasks={tasks} />
            </Panel>
            <Panel title="Évolution hebdomadaire" description="Tâches terminées par semaine">
              <WeeklyChart data={weekly} max={maxWeekly} />
            </Panel>
          </div>
        </>
      ) : null}
    </div>
  );
}

function StagiaireSummary({ tasks }: { tasks: Task[] }) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "Terminée").length;
  const inProgress = tasks.filter((t) => t.status === "En cours").length;
  const late = tasks.filter((t) => t.status === "En retard").length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <>
      <ul className="space-y-1.5 text-sm">
        <li>
          Total tâches : <span className="font-semibold">{total}</span>
        </li>
        <li>
          Terminées : <span className="font-semibold text-success">{done}</span>
        </li>
        <li>
          En cours : <span className="font-semibold text-warning">{inProgress}</span>
        </li>
        <li>
          Retard : <span className="font-semibold text-destructive">{late}</span>
        </li>
      </ul>
      <div className="mt-4">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progression</span>
          <span className="font-semibold text-foreground">{pct} %</span>
        </div>
        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </>
  );
}

function RhStats({ tasks, accounts }: { tasks: Task[]; accounts: Account[] }) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "Terminée").length;
  const late = tasks.filter((t) => t.status === "En retard").length;
  const rate = total ? Math.round((done / total) * 100) : 0;
  const deptCount = new Set(accounts.map((a) => a.department).filter(Boolean)).size;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Stagiaires actifs"
        value={String(accounts.filter((a) => a.active).length)}
        hint={`${deptCount} département(s)`}
      />
      <StatCard label="Tâches créées" value={String(total)} tone="success" />
      <StatCard label="Taux de réalisation" value={`${rate} %`} tone="warning" />
      <StatCard label="Tâches en retard" value={String(late)} tone="danger" />
    </div>
  );
}

function DeptBars({
  departments,
  accounts,
  tasks,
  fullName,
}: {
  departments: { id: string; name: string }[];
  accounts: Account[];
  tasks: Task[];
  fullName: (a: Account) => string;
}) {
  const counts = departments.map((d) => {
    const names = new Set(accounts.filter((a) => a.department === d.name).map(fullName));
    const count = tasks.filter((t) => names.has(t.assignedTo)).length;
    return { name: d.name, count };
  });
  const max = Math.max(...counts.map((c) => c.count), 1);
  return (
    <div className="space-y-3">
      {counts.map((c) => (
        <BarRow key={c.name} label={c.name} value={c.count} max={max} tone="success" />
      ))}
    </div>
  );
}

function StatusBars({ tasks }: { tasks: Task[] }) {
  const total = tasks.length || 1;
  const done = tasks.filter((t) => t.status === "Terminée").length;
  const inProgress = tasks.filter((t) => t.status === "En cours").length;
  const late = tasks.filter((t) => t.status === "En retard").length;
  const rows = [
    { label: "Terminées", value: Math.round((done / total) * 100), tone: "success" as const },
    { label: "En cours", value: Math.round((inProgress / total) * 100), tone: "warning" as const },
    { label: "En retard", value: Math.round((late / total) * 100), tone: "danger" as const },
  ];
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <BarRow key={r.label} label={r.label} value={r.value} max={100} tone={r.tone} />
      ))}
    </div>
  );
}

function WeeklyChart({ data, max }: { data: { week: string; done: number }[]; max: number }) {
  return (
    <div className="flex h-40 items-end gap-4">
      {data.map((w) => (
        <div key={w.week} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-xs font-semibold tabular-nums">{w.done}</span>
          <span
            className="w-full rounded-t-md bg-primary"
            style={{ height: `${(w.done / max) * 100}%` }}
          />
          <span className="text-xs text-muted-foreground">{w.week}</span>
        </div>
      ))}
    </div>
  );
}