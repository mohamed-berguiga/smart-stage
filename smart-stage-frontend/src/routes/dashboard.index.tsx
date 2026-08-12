import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, FileText, Power, Trash2, Upload, Users } from "lucide-react";
import { AttestationPanel } from "@/components/attestation-panel";
import { ImportStagiairesModal } from "@/components/import-stagiaires";

import { Panel, StatCard, StatusBadge } from "@/components/dashboard-ui";
import {
  Field,
  GhostButton,
  Modal,
  PrimaryButton,
  Select,
  TextInput,
} from "@/components/form-ui";
import { useSession, type Role } from "@/lib/session";
import { useStore, type NewAccountInput } from "@/lib/store";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Aperçu de mon espace — Smart Stage" },
      {
        name: "description",
        content:
          "Aperçu personnalisé selon votre rôle : indicateurs clés, activité récente et notifications de vos stages.",
      },
      { property: "og:title", content: "Aperçu de mon espace — Smart Stage" },
      { property: "og:description", content: "Indicateurs clés et activité récente de votre espace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Overview,
});

const roleSpace: Record<Role, string> = {
  RH: "Espace RH",
  ENCADRANT: "Espace Encadrant",
  STAGIAIRE: "Espace Stagiaire",
};

function Overview() {
  const { user, role } = useSession();
  if (!user || !role) return null;
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <div className="space-y-6">
      <div className="surface-card p-5">
        <h1 className="text-xl font-bold">Bonjour {fullName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {roleSpace[role]} — voici l'essentiel de votre semaine.
        </p>
      </div>

      {role === "RH" ? <RhOverview /> : null}
      {role === "ENCADRANT" ? <EncadrantOverview /> : null}
      {role === "STAGIAIRE" ? <StagiaireOverview /> : null}
    </div>
  );
}

/* ---------------------------------- RH ---------------------------------- */

function RhOverview() {
  const {
    accounts,
    accountsLoading,
    departments,
    fullName,
    addAccount,
    deleteAccount,
    toggleAccount,
    tasks,
  } = useStore();
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [openSupervisor, setOpenSupervisor] = useState<string | null>(null);
  const [accountSearch, setAccountSearch] = useState("");

  const supervisorAccounts = accounts.filter((a) => a.role === "encadrant");
  const internAccounts = accounts.filter((a) => a.role === "stagiaire");
  const detail = accounts.find((a) => a.id === detailId);

  const filteredAccounts = accounts.filter((a) => {
    if (!accountSearch.trim()) return true;
    const q = accountSearch.trim().toLowerCase();
    return fullName(a).toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
  });

  const selectedInterns = openSupervisor
    ? internAccounts.filter((a) => a.supervisor === openSupervisor)
    : [];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Stagiaires actifs" value={String(internAccounts.filter((a) => a.active).length)} hint="tous départements" />
        <StatCard label="Encadrants" value={String(supervisorAccounts.length)} tone="success" />
        <StatCard label="Comptes désactivés" value={String(accounts.filter((a) => !a.active).length)} tone="warning" />
        <StatCard label="Tâches suivies" value={String(tasks.length)} tone="danger" />
      </div>

      <Panel
        title="Gestion des comptes"
        description="Créer, activer, désactiver ou supprimer un compte"
        action={
          <div className="flex flex-wrap gap-2">
            <GhostButton onClick={() => setImportOpen(true)}>
              <span className="inline-flex items-center gap-1.5">
                <Upload className="size-4" />
                Importer en masse
              </span>
            </GhostButton>
            <PrimaryButton onClick={() => setOpen(true)}>Nouveau compte</PrimaryButton>
          </div>
        }

      >
        {accountsLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
        <div className="overflow-x-auto">
          <div className="mb-3 max-w-xs">
            <TextInput
              value={accountSearch}
              onChange={(e) => setAccountSearch(e.target.value)}
              placeholder="Rechercher par nom ou email…"
            />
          </div>
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-4">Nom</th>
                <th className="pb-2 pr-4">Rôle</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Département</th>
                <th className="pb-2 pr-4">État</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-sm text-muted-foreground">
                    Aucun compte ne correspond à cette recherche.
                  </td>
                </tr>
              ) : null}
              {filteredAccounts.map((a) => (
                <tr key={a.id} className="border-b border-border/60 last:border-0">
                  <td className="py-3 pr-4 font-medium">{fullName(a)}</td>
                  <td className="py-3 pr-4 text-muted-foreground capitalize">{a.role}</td>
                  <td className="py-3 pr-4 text-xs text-muted-foreground">{a.email}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{a.department}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        a.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {a.active ? "Actif" : "Désactivé"}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          toggleAccount(a.id).catch((err) =>
                            toast.error(err instanceof Error ? err.message : "Erreur"),
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1.5 text-xs font-medium hover:text-foreground"
                      >
                        <Power className="size-3.5" />
                        {a.active ? "Désactiver" : "Activer"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Supprimer le compte de ${fullName(a)} ?`))
                            deleteAccount(a.id).catch((err) =>
                              toast.error(err instanceof Error ? err.message : "Erreur"),
                            );
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                        Supprimer
                      </button>
                      {a.role === "stagiaire" ? (
                        <button
                          type="button"
                          onClick={() => setDetailId(a.id)}
                          className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary"
                        >
                          <FileText className="size-3.5" />
                          Fiche
                        </button>
                      ) : null}

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </Panel>

      <Panel title="Encadrants" description="Cliquez sur un encadrant pour voir ses stagiaires">
        <div className="grid gap-3 sm:grid-cols-3">
          {supervisorAccounts.map((s) => {
            const name = fullName(s);
            const count = internAccounts.filter((i) => i.supervisor === name).length;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setOpenSupervisor(name)}
                className="rounded-lg bg-muted p-4 text-left transition-colors hover:bg-secondary"
              >
                <p className="font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">{s.department}</p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm">
                  <Users className="size-4 text-primary" />
                  <span className="font-semibold text-primary">{count}</span> stagiaires
                </p>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel title="Départements" description="Répartition des stagiaires">
        <div className="grid gap-3 sm:grid-cols-4">
          {departments.map((d) => {
            const count = internAccounts.filter((i) => i.department === d.name).length;
            return (
              <div key={d.id} className="rounded-lg bg-muted p-4 text-sm">
                <p className="font-medium">{d.name}</p>
                <p className="text-xs text-muted-foreground">{count} stagiaire(s)</p>
              </div>
            );
          })}
        </div>
      </Panel>

      <NewAccountModal
        open={open}
        onClose={() => setOpen(false)}
        supervisors={supervisorAccounts.map((s) => ({ id: s.id, name: fullName(s) }))}
        departments={departments.map((d) => d.name)}
        onCreate={(a) => {
          addAccount(a)
            .then(() => {
              toast.success("Compte créé");
              setOpen(false);
            })
            .catch((err) => toast.error(err instanceof Error ? err.message : "Erreur"));
        }}
      />

      <Modal
        open={openSupervisor !== null}
        title={`Stagiaires de ${openSupervisor ?? ""}`}
        description={`${selectedInterns.length} stagiaire(s) rattaché(s)`}
        onClose={() => setOpenSupervisor(null)}
      >
        <ul className="space-y-2">
          {selectedInterns.length === 0 ? (
            <li className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              Aucun stagiaire rattaché.
            </li>
          ) : null}
          {selectedInterns.map((i) => (
            <li key={i.id} className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">{fullName(i)}</p>
              <p className="text-xs text-muted-foreground">
                {i.department} · {i.email} · {i.active ? "Actif" : "Désactivé"}
              </p>
              <button
                type="button"
                onClick={() => {
                  setOpenSupervisor(null);
                  setDetailId(i.id);
                }}
                className="mt-2 text-xs font-medium text-primary hover:underline"
              >
                Ouvrir la fiche
              </button>
            </li>
          ))}
        </ul>
      </Modal>

      <ImportStagiairesModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        supervisors={supervisorAccounts.map((s) => ({ id: s.id, name: fullName(s) }))}
      />

      <Modal
        open={detailId !== null}
        title={detail ? fullName(detail) : ""}
        description={
          detail
            ? `${detail.department} · ${detail.email}${
                detail.endDate ? ` · fin de stage ${detail.endDate}` : ""
              }`
            : ""
        }
        onClose={() => setDetailId(null)}
      >
        {detail ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              <p>Encadrant : {detail.supervisor ?? "—"}</p>
              <p>
                Période : {detail.startDate ?? "—"} → {detail.endDate ?? "—"}
              </p>
              <p>Tâches suivies : {tasks.filter((t) => t.assignedTo === fullName(detail)).length}</p>
            </div>
            <AttestationPanel intern={detail} />
          </div>
        ) : null}
      </Modal>
    </>
  );

}

function NewAccountModal({
  open,
  onClose,
  supervisors,
  departments,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  supervisors: { id: string; name: string }[];
  departments: string[];
  onCreate: (a: NewAccountInput) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"rh" | "encadrant" | "stagiaire">("stagiaire");
  const [department, setDepartment] = useState("");
  const [supervisorId, setSupervisorId] = useState(supervisors[0]?.id ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!department && departments.length > 0) setDepartment(departments[0]!);
  }, [departments, department]);

  useEffect(() => {
    if (!supervisorId && supervisors.length > 0) setSupervisorId(supervisors[0]!.id);
  }, [supervisors, supervisorId]);

  const submit = () => {
    if (!firstName || !lastName || !email || password.length < 6) return;
    if (role === "stagiaire" && (!department || !supervisorId || !startDate || !endDate)) {
      toast.error("Département, encadrant, date de début et date de fin sont obligatoires pour un stagiaire.");
      return;
    }
    onCreate({
      firstName,
      lastName,
      email,
      password,
      phone,
      role,
      department,
      encadrantId: role === "stagiaire" ? supervisorId : undefined,
      startDate: role === "stagiaire" ? startDate || undefined : undefined,
      endDate: role === "stagiaire" ? endDate || undefined : undefined,
    });
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <Modal
      open={open}
      title="Nouveau compte"
      description="Renseignez les informations de l'utilisateur"
      onClose={onClose}
    >
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nom">
            <TextInput value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Mohamed" />
          </Field>
          <Field label="Prénom">
            <TextInput value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ahmed" />
          </Field>
        </div>
        <Field label="Email">
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ahmed@smartstage.tn" />
        </Field>
        <Field label="Mot de passe (min. 6 caractères)">
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>
        <Field label="Téléphone">
          <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+216 ..." />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Rôle">
            <Select value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
              <option value="stagiaire">Stagiaire</option>
              <option value="encadrant">Encadrant</option>
              <option value="rh">RH</option>
            </Select>
          </Field>
          <Field label="Département">
            <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        {role === "stagiaire" ? (
          <>
            <Field label="Encadrant *">
              <Select value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)}>
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Début du stage *">
                <TextInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </Field>
              <Field label="Fin du stage *">
                <TextInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </Field>
            </div>
          </>
        ) : null}
        <div className="flex justify-end gap-2 pt-1">
          <GhostButton onClick={onClose}>Annuler</GhostButton>
          <PrimaryButton onClick={submit}>Créer le compte</PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------- Encadrant ------------------------------ */

function EncadrantOverview() {
  const { myStagiaires, tasks } = useStore();
  const [openList, setOpenList] = useState(false);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Mes stagiaires" value={String(myStagiaires.length)} />
        <StatCard label="Tâches assignées" value={String(tasks.length)} tone="success" />
        <StatCard
          label="À valider"
          value={String(tasks.filter((t) => t.status === "En cours").length)}
          tone="warning"
        />
        <StatCard
          label="En retard"
          value={String(tasks.filter((t) => t.status === "En retard").length)}
          tone="danger"
        />
      </div>

      <Panel
        title="Mes stagiaires"
        description="Cliquez pour afficher la liste complète"
        action={<PrimaryButton onClick={() => setOpenList(true)}>Mes stagiaires</PrimaryButton>}
      >
        <div className="space-y-3">
          {myStagiaires.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun stagiaire affecté pour le moment.</p>
          ) : (
            myStagiaires.map((i) => {
              const total = tasks.filter((t) => t.assignedTo === i.name).length;
              const done = tasks.filter((t) => t.assignedTo === i.name && t.status === "Terminée").length;
              const pct = total ? Math.round((done / total) * 100) : 0;
              return (
                <div key={i.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{i.name}</p>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {done}/{total} tâches
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Panel>

      <Panel title="Dernières tâches créées" description="Tâches que vous avez assignées">
        <ul className="space-y-2 text-sm">
          {tasks.slice(0, 5).map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted p-3"
            >
              <span>
                <span className="font-medium">{t.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {t.assignedTo} · échéance {t.deadline}
                </span>
              </span>
              <StatusBadge status={t.status} />
            </li>
          ))}
        </ul>
      </Panel>

      <Modal
        open={openList}
        title="Mes stagiaires"
        description={`${myStagiaires.length} stagiaire(s) suivi(s)`}
        onClose={() => setOpenList(false)}
      >
        <ul className="space-y-2">
          {myStagiaires.map((i) => (
            <li key={i.id} className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">{i.name}</p>
              <p className="text-xs text-muted-foreground">
                {tasks.filter((t) => t.assignedTo === i.name).length} tâches
              </p>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}

/* ------------------------------- Stagiaire ------------------------------ */

function StagiaireOverview() {
  const { user } = useSession();
  const { tasks, addTask, updateTask, deleteTask } = useStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  if (!user) return null;

  // Déjà scopé aux tâches du stagiaire connecté par le backend (pro + perso).
  // Les tâches personnelles ("Mes tâches personnelles") sont de vraies tâches
  // isPersonal=true, pas une liste séparée : on les distingue simplement ici.
  const proTasks = tasks.filter((t) => !t.isPersonal);
  const personal = tasks.filter((t) => t.isPersonal);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Mes tâches" value={String(proTasks.length)} hint="Semaine 3" />
        <StatCard
          label="Terminées"
          value={String(proTasks.filter((t) => t.status === "Terminée").length)}
          tone="success"
        />
        <StatCard
          label="En cours"
          value={String(proTasks.filter((t) => t.status === "En cours").length)}
          tone="warning"
        />
        <StatCard
          label="En retard"
          value={String(proTasks.filter((t) => t.status === "En retard").length)}
          tone="danger"
        />
      </div>

      <div>
        <Panel
          title="Mes tâches personnelles"
          description="Visibles uniquement par vous, hors statistiques"
          action={<PrimaryButton onClick={() => setOpen(true)}>Ajouter</PrimaryButton>}
        >
          <ul className="space-y-2">
            {personal.length === 0 ? (
              <li className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                Aucune tâche personnelle pour l'instant.
              </li>
            ) : null}
            {personal.map((p) => {
              const done = p.status === "Terminée";
              return (
                <li key={p.id} className="flex items-center gap-3 rounded-lg bg-muted p-3 text-sm">
                  <button
                    type="button"
                    onClick={() =>
                      updateTask(p.id, { status: done ? "A faire" : "Terminée" }).catch((err) =>
                        toast.error(err instanceof Error ? err.message : "Erreur"),
                      )
                    }
                    aria-label={`Basculer ${p.title}`}
                    className={`flex size-5 shrink-0 items-center justify-center rounded border ${
                      done ? "border-success bg-success text-success-foreground" : "border-border bg-card"
                    }`}
                  >
                    {done ? <Check className="size-3.5" /> : null}
                  </button>
                  <span className={`flex-1 ${done ? "text-muted-foreground line-through" : ""}`}>
                    {p.title}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      deleteTask(p.id).catch((err) =>
                        toast.error(err instanceof Error ? err.message : "Erreur"),
                      )
                    }
                    aria-label={`Supprimer ${p.title}`}
                    className="rounded-md p-1 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <Modal
        open={open}
        title="Nouvelle tâche personnelle"
        onClose={() => setOpen(false)}
        description="Visible uniquement par vous"
      >
        <div className="space-y-3">
          <Field label="Intitulé">
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Réviser MongoDB"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <GhostButton onClick={() => setOpen(false)}>Annuler</GhostButton>
            <PrimaryButton
              onClick={() => {
                if (!title.trim()) return;
                addTask({
                  title: title.trim(),
                  type: "Personnel",
                  priority: "Faible",
                  status: "A faire",
                  assignedToId: user.id,
                  isPersonal: true,
                })
                  .then(() => {
                    toast.success("Tâche personnelle ajoutée");
                    setTitle("");
                    setOpen(false);
                  })
                  .catch((err) => toast.error(err instanceof Error ? err.message : "Erreur"));
              }}
            >
              Ajouter
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </>
  );
}