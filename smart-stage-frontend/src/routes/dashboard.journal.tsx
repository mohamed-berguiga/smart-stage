import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Panel } from "@/components/dashboard-ui";
import { Field, GhostButton, Modal, PrimaryButton, TextArea, TextInput } from "@/components/form-ui";
import { useSession } from "@/lib/session";
import { api, ApiError } from "@/lib/api";

export const Route = createFileRoute("/dashboard/journal")({
  head: () => ({
    meta: [
      { title: "Journal de stage — Smart Stage" },
      {
        name: "description",
        content:
          "Journal de stage quotidien : activités réalisées, heures travaillées et suivi par département selon votre rôle.",
      },
      { property: "og:title", content: "Journal de stage — Smart Stage" },
      { property: "og:description", content: "Activités quotidiennes et heures travaillées." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JournalPage,
});

type ApiEntry = {
  _id: string;
  title: string;
  text: string;
  hours?: number;
  visaed: boolean;
  createdAt: string;
  author: { _id: string; firstName: string; lastName: string; role: string };
  department: { _id: string; name: string } | null;
};

type ApiJournalComment = {
  _id: string;
  content: string;
  createdAt: string;
  author: { _id: string; firstName: string; lastName: string; role: string };
};

function frDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long" });
}

function JournalPage() {
  const { user, role } = useSession();
  const [entries, setEntries] = useState<ApiEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [hours, setHours] = useState("");

  // Commentaire ciblé sur UNE entrée précise (plus de sélecteur de stagiaire :
  // l'entrée elle-même détermine qui est concerné).
  const [commentEntry, setCommentEntry] = useState<ApiEntry | null>(null);
  const [entryComments, setEntryComments] = useState<ApiJournalComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await api.get<ApiEntry[]>("/journal");
      setEntries(data);
    } catch {
      toast.error("Erreur lors du chargement du journal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!commentEntry) {
      setEntryComments([]);
      return;
    }
    setCommentsLoading(true);
    api
      .get<ApiJournalComment[]>(`/journal/${commentEntry._id}/comments`)
      .then(setEntryComments)
      .catch(() => toast.error("Erreur lors du chargement des commentaires"))
      .finally(() => setCommentsLoading(false));
  }, [commentEntry]);

  if (!user || !role) return null;

  const totalHours = entries.reduce((sum, e) => sum + (e.hours ?? 0), 0);

  const save = async () => {
    if (!title.trim()) return;
    try {
      await api.post("/journal", {
        title: title.trim(),
        text: text.trim(),
        ...(hours ? { hours: Number(hours) } : {}),
      });
      setTitle("");
      setText("");
      setHours("");
      setOpen(false);
      toast.success("Entrée enregistrée");
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement");
    }
  };

  const toggleVisa = async (id: string) => {
    try {
      await api.patch(`/journal/${id}/visa`);
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur");
    }
  };

  const sendComment = async () => {
    if (!commentText.trim() || !commentEntry) return;
    try {
      const created = await api.post<ApiJournalComment>(`/journal/${commentEntry._id}/comments`, {
        content: commentText.trim(),
      });
      setEntryComments((prev) => [...prev, created]);
      setCommentText("");
      toast.success("Commentaire envoyé");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur lors de l'envoi");
    }
  };

  return (
    <div className="space-y-6">
      <Panel
        title={
          role === "RH"
            ? "Journal de toute l'entreprise"
            : role === "ENCADRANT"
              ? "Journal de mon département"
              : "Mon journal de stage"
        }
        description={
          role === "ENCADRANT"
            ? "Vérifiez et commentez les entrées de vos stagiaires"
            : `${entries.length} entrées · ${totalHours} h déclarées`
        }
        action={
          role === "STAGIAIRE" ? (
            <PrimaryButton onClick={() => setOpen(true)}>Nouvelle entrée</PrimaryButton>
          ) : null
        }
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : entries.length === 0 ? (
          <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            Aucune entrée pour le moment.
          </p>
        ) : (
        <ol className="space-y-3">
          {entries.map((e) => {
            const authorName = `${e.author.firstName} ${e.author.lastName}`;
            return (
              <li key={e._id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{e.title}</p>
                  <span className="text-xs text-muted-foreground">
                    {frDate(e.createdAt)}
                    {e.hours ? ` · ${e.hours} h` : ""}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{e.text}</p>
                {role !== "STAGIAIRE" ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {authorName} · {e.author.role} · {e.department?.name ?? "—"}
                  </p>
                ) : null}
                {e.visaed ? (
                  <p className="mt-2 text-xs font-medium text-success">Entrée visée ✓</p>
                ) : null}
                <div className="mt-3 flex gap-2 text-xs font-medium">
                  {role === "ENCADRANT" ? (
                    <button
                      type="button"
                      onClick={() => void toggleVisa(e._id)}
                      className="rounded-md bg-success/15 px-3 py-1.5 text-success"
                    >
                      {e.visaed ? "Retirer le visa" : "Viser l'entrée"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setCommentEntry(e)}
                    className="rounded-md bg-muted px-3 py-1.5 text-muted-foreground"
                  >
                    Commenter
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
        )}
      </Panel>

      <Modal
        open={open}
        title="Nouvelle entrée de journal"
        description="Décrivez votre journée de travail"
        onClose={() => setOpen(false)}
      >
        <div className="space-y-3">
          <Field label="Titre de la journée">
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Intégration de la page de connexion"
            />
          </Field>
          <Field label="Activités réalisées">
            <TextArea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Activités, difficultés, apprentissages…"
            />
          </Field>
          <Field label="Heures travaillées">
            <TextInput
              type="number"
              min={0}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="6"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <GhostButton onClick={() => setOpen(false)}>Annuler</GhostButton>
            <PrimaryButton onClick={() => void save()}>Enregistrer</PrimaryButton>
          </div>
        </div>
      </Modal>

      <Modal
        open={commentEntry !== null}
        title={commentEntry ? `Commentaires — ${commentEntry.title}` : "Commentaires"}
        description={
          commentEntry
            ? `Entrée de ${commentEntry.author.firstName} ${commentEntry.author.lastName}`
            : ""
        }
        onClose={() => setCommentEntry(null)}
      >
        <div className="space-y-3">
          {commentsLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : entryComments.length === 0 ? (
            <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              Aucun commentaire pour l'instant.
            </p>
          ) : (
            <ul className="max-h-56 space-y-2 overflow-y-auto">
              {entryComments.map((c) => (
                <li key={c._id} className="rounded-lg bg-muted p-3 text-sm">
                  <p className="font-medium">
                    {c.author.firstName} {c.author.lastName}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      {frDate(c.createdAt)}
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
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Votre retour…"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <GhostButton onClick={() => setCommentEntry(null)}>Fermer</GhostButton>
            <PrimaryButton onClick={() => void sendComment()}>Envoyer</PrimaryButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}