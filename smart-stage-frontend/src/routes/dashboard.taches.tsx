import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Paperclip, History as HistoryIcon, Sparkles } from "lucide-react";
import { Panel, PriorityBadge, StatusBadge } from "@/components/dashboard-ui";
import { KanbanBoard } from "@/components/kanban-board";

import {
  Field,
  GhostButton,
  Modal,
  PrimaryButton,
  Select,
  TextArea,
  TextInput,
} from "@/components/form-ui";
import type { Task, TaskPriority, TaskStatus } from "@/lib/demo-data";
import { useSession } from "@/lib/session";
import { priorities, taskTypes, useStore } from "@/lib/store";
import { api, ApiError } from "@/lib/api";

export const Route = createFileRoute("/dashboard/taches")({
  head: () => ({
    meta: [
      { title: "Suivi des tâches — Smart Stage" },
      {
        name: "description",
        content:
          "Suivi des tâches de stage : statuts, priorités, échéances et commentaires, adaptés à votre rôle.",
      },
      { property: "og:title", content: "Suivi des tâches — Smart Stage" },
      { property: "og:description", content: "Statuts, priorités, échéances et commentaires des tâches." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TasksPage,
});

const stagiaireStatuses: TaskStatus[] = ["A faire", "En cours", "Terminée"];

type ApiComment = {
  _id: string;
  content: string;
  createdAt: string;
  author: { _id: string; firstName: string; lastName: string; role: string };
};

type ApiAttachment = {
  _id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
};

type ApiHistoryEntry = {
  _id: string;
  action: string;
  timestamp: string;
  performedBy: { _id: string; firstName: string; lastName: string; role: string };
};

function frDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });
}

function TasksPage() {
  const { user, role } = useSession();
  const { tasks, tasksLoading, myStagiaires, addTask, updateTask, deleteTask } = useStore();
  const [formOpen, setFormOpen] = useState(false);
  const [view, setView] = useState<"liste" | "kanban">("liste");
  const [editing, setEditing] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "">("");

  // Commentaires : liés à une tâche précise (le backend exige un taskId).
  const [commentTask, setCommentTask] = useState<Task | null>(null);
  const [taskComments, setTaskComments] = useState<ApiComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");

  // Pièces jointes de la même tâche (même modale que les commentaires).
  const [taskAttachments, setTaskAttachments] = useState<ApiAttachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Historique : modale à part, en lecture seule pour tous les rôles.
  const [historyTask, setHistoryTask] = useState<Task | null>(null);
  const [taskHistory, setTaskHistory] = useState<ApiHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!historyTask) {
      setTaskHistory([]);
      return;
    }
    setHistoryLoading(true);
    api
      .get<ApiHistoryEntry[]>(`/tasks/${historyTask.id}/history`)
      .then(setTaskHistory)
      .catch(() => toast.error("Erreur lors du chargement de l'historique"))
      .finally(() => setHistoryLoading(false));
  }, [historyTask]);

  useEffect(() => {
    if (!commentTask) {
      setTaskComments([]);
      return;
    }
    setCommentsLoading(true);
    api
      .get<ApiComment[]>(`/tasks/${commentTask.id}/comments`)
      .then(setTaskComments)
      .catch(() => toast.error("Erreur lors du chargement des commentaires"))
      .finally(() => setCommentsLoading(false));
  }, [commentTask]);

  useEffect(() => {
    if (!commentTask) {
      setTaskAttachments([]);
      return;
    }
    setAttachmentsLoading(true);
    api
      .get<ApiAttachment[]>(`/tasks/${commentTask.id}/attachments`)
      .then(setTaskAttachments)
      .catch(() => toast.error("Erreur lors du chargement des pièces jointes"))
      .finally(() => setAttachmentsLoading(false));
  }, [commentTask]);

  if (!user || !role) return null;
  const fullName = `${user.firstName} ${user.lastName}`;

  // Le backend renvoie déjà uniquement les tâches visibles par ce rôle
  // (RH : toutes les tâches pro ; Encadrant : celles de ses stagiaires ;
  // Stagiaire : les siennes) — le filtrage recherche/statut/priorité se fait
  // ensuite côté client, la liste étant déjà entièrement chargée en mémoire.
  const visible = tasks.filter((t) => {
    if (searchQuery.trim() && !t.title.toLowerCase().includes(searchQuery.trim().toLowerCase())) {
      return false;
    }
    if (statusFilter && t.status !== statusFilter) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    return true;
  });
  const hasActiveFilters = !!(searchQuery || statusFilter || priorityFilter);

  // Liste utilisée dans le formulaire de création de tâche.
  const internOptions =
    role === "ENCADRANT"
      ? myStagiaires
      : role === "STAGIAIRE"
        ? [{ id: user.id, name: fullName }]
        : [];

  const sendComment = async () => {
    if (!newComment.trim() || !commentTask) return;
    try {
      const created = await api.post<ApiComment>(`/tasks/${commentTask.id}/comments`, {
        content: newComment.trim(),
      });
      setTaskComments((prev) => [...prev, created]);
      setNewComment("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur lors de l'envoi");
    }
  };

  const uploadAttachment = async (file: File) => {
    if (!commentTask) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const created = await api.upload<ApiAttachment>(`/tasks/${commentTask.id}/attachments`, formData);
      setTaskAttachments((prev) => [created, ...prev]);
      toast.success("Pièce jointe ajoutée");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur lors de l'envoi du fichier");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Panel
        title={
          role === "RH"
            ? "Toutes les tâches"
            : role === "ENCADRANT"
              ? "Tâches de mes stagiaires"
              : "Mes tâches"
        }
        description={
          role === "RH"
            ? "Lecture seule — vue globale de l'entreprise"
            : role === "ENCADRANT"
              ? "Créez, modifiez et validez les tâches"
              : "Faites évoluer le statut de vos tâches"
        }
        action={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-muted p-0.5 text-xs font-medium">
              {(["liste", "kanban"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`rounded-md px-3 py-1.5 capitalize transition-colors ${
                    view === v
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {v === "liste" ? "Liste" : "Kanban"}
                </button>
              ))}
            </div>
            {role !== "RH" ? (
              <PrimaryButton
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                {role === "ENCADRANT" ? "Nouvelle tâche" : "Ajouter une tâche"}
              </PrimaryButton>
            ) : null}
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="min-w-[12rem] flex-1">
            <TextInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par titre…"
            />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "")}>
            <option value="">Tous les statuts</option>
            {(["A faire", "En cours", "Terminée", "En retard"] as TaskStatus[]).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | "")}
          >
            <option value="">Toutes les priorités</option>
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("");
                setPriorityFilter("");
              }}
              className="text-xs font-medium text-primary hover:underline"
            >
              Réinitialiser
            </button>
          ) : null}
        </div>

        {tasksLoading ? (
          <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">Chargement…</p>
        ) : view === "kanban" ? (
          <KanbanBoard
            tasks={visible}
            showAssignee={role !== "STAGIAIRE"}
            canDrag={role !== "RH"}
            onStatusChange={async (id, status) => {
              try {
                await updateTask(id, { status });
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Erreur de mise à jour");
                throw err;
              }
            }}
          />
        ) : (
        <ul className="space-y-3">

          {visible.length === 0 ? (
            <li className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              {hasActiveFilters ? "Aucune tâche ne correspond à ces filtres." : "Aucune tâche pour le moment."}
            </li>
          ) : null}
          {visible.map((t) => (
            <li key={t.id} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{t.title}</p>
                <StatusBadge status={t.status} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <PriorityBadge priority={t.priority} />
                <span>{t.type}</span>
                <span>·</span>
                <span>Échéance {t.deadline}</span>
                {role !== "STAGIAIRE" ? (
                  <>
                    <span>·</span>
                    <span>Stagiaire : {t.assignedTo}</span>
                  </>
                ) : (
                  <>
                    <span>·</span>
                    <span>Encadrant : {t.createdBy}</span>
                  </>
                )}
                {role === "RH" ? (
                  <>
                    <span>·</span>
                    <span>Encadrant : {t.createdBy}</span>
                  </>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {role === "STAGIAIRE"
                  ? stagiaireStatuses.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          updateTask(t.id, { status: s }).catch((err) =>
                            toast.error(err instanceof Error ? err.message : "Erreur"),
                          )
                        }
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          s === t.status
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {s}
                      </button>
                    ))
                  : null}

                {role === "STAGIAIRE" ? (
                  <button
                    type="button"
                    onClick={() => setCommentTask(t)}
                    className="rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                  >
                    Commenter
                  </button>
                ) : null}

                {role === "ENCADRANT" ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        updateTask(t.id, { status: "Terminée" }).catch((err) =>
                          toast.error(err instanceof Error ? err.message : "Erreur"),
                        )
                      }
                      className="rounded-md bg-success/15 px-3 py-1.5 text-xs font-medium text-success"
                    >
                      {t.status === "Terminée" ? "Validée ✓" : "Valider"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(t);
                        setFormOpen(true);
                      }}
                      className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Supprimer la tâche « ${t.title} » ?`))
                          deleteTask(t.id).catch((err) =>
                            toast.error(err instanceof Error ? err.message : "Erreur"),
                          );
                      }}
                      className="rounded-md bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive"
                    >
                      Supprimer
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommentTask(t)}
                      className="rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                    >
                      Commenter
                    </button>
                  </>
                ) : null}

                <button
                  type="button"
                  onClick={() => setHistoryTask(t)}
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <HistoryIcon className="size-3.5" />
                  Historique
                </button>
              </div>
            </li>
          ))}
        </ul>
        )}

      </Panel>

      <Modal
        open={commentTask !== null}
        title={commentTask ? `Détails — ${commentTask.title}` : "Détails de la tâche"}
        description={commentTask ? `Stagiaire : ${commentTask.assignedTo}` : ""}
        onClose={() => setCommentTask(null)}
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-semibold">Pièces jointes</p>
            {attachmentsLoading ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : taskAttachments.length === 0 ? (
              <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                Aucune pièce jointe.
              </p>
            ) : (
              <ul className="max-h-40 space-y-1.5 overflow-y-auto">
                {taskAttachments.map((a) => (
                  <li
                    key={a._id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-muted p-2 text-xs"
                  >
                    <a
                      href={api.fileUrl(a.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                    >
                      <Paperclip className="size-3.5 shrink-0" />
                      <span className="truncate">{a.fileName}</span>
                    </a>
                    <span className="shrink-0 text-muted-foreground">{frDateTime(a.uploadedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadAttachment(file);
                e.target.value = "";
              }}
            />
            <GhostButton onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <span className="inline-flex items-center gap-1.5">
                <Paperclip className="size-3.5" />
                {uploading ? "Envoi en cours…" : "Joindre un fichier"}
              </span>
            </GhostButton>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm font-semibold">Commentaires</p>
            {commentsLoading ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : taskComments.length === 0 ? (
              <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                Aucun commentaire pour l'instant.
              </p>
            ) : (
              <ul className="max-h-56 space-y-2 overflow-y-auto">
                {taskComments.map((c) => (
                  <li key={c._id} className="rounded-lg bg-muted p-3 text-sm">
                    <p className="font-medium">
                      {c.author.firstName} {c.author.lastName}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        {frDateTime(c.createdAt)}
                      </span>
                    </p>
                    <p className="mt-1 text-muted-foreground">{c.content}</p>
                  </li>
                ))}
              </ul>
            )}
            <Field label="Ajouter un commentaire">
              <TextArea
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Votre message…"
              />
            </Field>
            <div className="flex justify-end gap-2">
              <GhostButton onClick={() => setCommentTask(null)}>Fermer</GhostButton>
              <PrimaryButton onClick={() => void sendComment()}>Envoyer</PrimaryButton>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={historyTask !== null}
        title={historyTask ? `Historique — ${historyTask.title}` : "Historique"}
        description="Actions effectuées sur cette tâche, dans l'ordre chronologique"
        onClose={() => setHistoryTask(null)}
      >
        <div className="space-y-3">
          {historyLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : taskHistory.length === 0 ? (
            <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              Aucun historique pour l'instant.
            </p>
          ) : (
            <ol className="max-h-80 space-y-2 overflow-y-auto border-l-2 border-border pl-4">
              {taskHistory.map((h) => (
                <li key={h._id} className="relative text-sm">
                  <span className="absolute -left-[1.15rem] top-1.5 size-2 rounded-full bg-primary" />
                  <p className="font-medium">{h.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {h.performedBy.firstName} {h.performedBy.lastName} · {frDateTime(h.timestamp)}
                  </p>
                </li>
              ))}
            </ol>
          )}
          <div className="flex justify-end">
            <GhostButton onClick={() => setHistoryTask(null)}>Fermer</GhostButton>
          </div>
        </div>
      </Modal>

      <TaskFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
        interns={internOptions}
        onSubmit={(data) => {
          const action = editing
            ? updateTask(editing.id, {
                title: data.title,
                type: data.type,
                priority: data.priority,
                status: data.status,
                dueDate: data.dueDate,
                description: data.description,
              })
            : addTask({
                title: data.title,
                type: data.type,
                priority: data.priority,
                status: data.status,
                dueDate: data.dueDate,
                assignedToId: data.assignedToId,
                isPersonal: role === "STAGIAIRE",
                description: data.description,
              });

          action
            .then(() => {
              toast.success(editing ? "Tâche mise à jour" : "Tâche créée");
              setFormOpen(false);
              setEditing(null);
            })
            .catch((err) => {
              toast.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
            });
        }}
      />
    </div>
  );
}

function TaskFormModal({
  open,
  onClose,
  editing,
  interns,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  editing: Task | null;
  interns: { id: string; name: string }[];
  onSubmit: (t: {
    title: string;
    type: string;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate?: string | undefined;
    assignedToId: string;
    description?: string | undefined;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [type, setType] = useState(taskTypes[0]!);
  const [priority, setPriority] = useState<TaskPriority>("Moyenne");
  const [status, setStatus] = useState<TaskStatus>("A faire");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [key, setKey] = useState("");

  // Réinitialise les champs quand la modale s'ouvre ou change de tâche.
  const formKey = `${open}-${editing?.id ?? "new"}`;
  if (key !== formKey) {
    setKey(formKey);
    setTitle(editing?.title ?? "");
    const matchingIntern = interns.find((i) => i.name === editing?.assignedTo);
    setAssignedToId(matchingIntern?.id ?? interns[0]?.id ?? "");
    setType(editing?.type ?? taskTypes[0]!);
    setPriority(editing?.priority ?? "Moyenne");
    setStatus(editing?.status === "En retard" ? "En cours" : editing?.status ?? "A faire");
    setDueDate("");
    setDescription(editing?.description ?? "");
  }

  const generateDescription = async () => {
    if (!title.trim()) {
      toast.error("Renseignez d'abord un intitulé de tâche.");
      return;
    }
    setGeneratingDescription(true);
    try {
      const res = await api.post<{ description: string }>("/ai/generate-task-description", {
        title: title.trim(),
        type,
      });
      setDescription(res.description);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur lors de la génération");
    } finally {
      setGeneratingDescription(false);
    }
  };

  return (
    <Modal
      open={open}
      title={editing ? "Modifier la tâche" : "Nouvelle tâche"}
      description="Renseignez les informations de la tâche"
      onClose={onClose}
    >
      <div className="space-y-3">
        <Field label="Intitulé de la tâche">
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Intégrer la page de connexion"
          />
        </Field>
        <Field label="Description">
          <div className="mb-1.5 flex justify-end">
            <button
              type="button"
              onClick={() => void generateDescription()}
              disabled={generatingDescription}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-60"
            >
              <Sparkles className="size-3.5" />
              {generatingDescription ? "Génération…" : "Générer avec l'IA"}
            </button>
          </div>
          <TextArea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez la tâche, ou laissez l'IA la rédiger pour vous (renseignez d'abord un intitulé)…"
          />
        </Field>
        {!editing ? (
          <Field label="Stagiaire">
            <Select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
              {interns.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Type">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {taskTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Importance">
            <Select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Statut">
            <Select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
              {(["A faire", "En cours", "Terminée"] as TaskStatus[]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Échéance">
            <TextInput
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <GhostButton onClick={onClose}>Annuler</GhostButton>
          <PrimaryButton
            onClick={() => {
              if (!title.trim() || (!editing && !assignedToId)) return;
              onSubmit({
                title: title.trim(),
                type,
                priority,
                status,
                dueDate: dueDate || undefined,
                assignedToId,
                description: description || undefined,
              });
            }}
          >
            {editing ? "Enregistrer" : "Créer la tâche"}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}