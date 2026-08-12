import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Panel } from "@/components/dashboard-ui";
import {
  Field,
  GhostButton,
  Modal,
  PrimaryButton,
  Select,
  TextArea,
  TextInput,
} from "@/components/form-ui";
import { levelPercent, skillLevels, type SkillLevel } from "@/lib/demo-data";
import { useSession } from "@/lib/session";
import { useStore } from "@/lib/store";
import { api, ApiError } from "@/lib/api";

export const Route = createFileRoute("/dashboard/competences")({
  head: () => ({
    meta: [
      { title: "Suivi des compétences — Smart Stage" },
      {
        name: "description",
        content:
          "Référentiel de compétences par département, évaluations des encadrants et progression des stagiaires.",
      },
      { property: "og:title", content: "Suivi des compétences — Smart Stage" },
      {
        property: "og:description",
        content: "Référentiel, évaluations et progression des objectifs de stage.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SkillsPage,
});

type ApiSkill = {
  _id: string;
  name: string;
  description: string;
  department: { _id: string; name: string } | null;
};

type ApiEvaluation = {
  _id: string;
  level: SkillLevel;
  comment: string;
  evaluatedAt: string;
  skill: { _id: string; name: string; description: string };
  evaluatedBy: { _id: string; firstName: string; lastName: string };
};

function SkillsPage() {
  const { role } = useSession();
  if (!role) return null;
  if (role === "RH") return <RhSkills />;
  if (role === "ENCADRANT") return <EncadrantSkills />;
  return <StagiaireSkills />;
}

/* ---------------------------------- RH ---------------------------------- */

function RhSkills() {
  const { departments } = useStore();
  const [skills, setSkills] = useState<ApiSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await api.get<ApiSkill[]>("/skills");
      setSkills(data);
    } catch {
      toast.error("Erreur lors du chargement des compétences");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!departmentId && departments.length > 0) setDepartmentId(departments[0]!.id);
  }, [departments, departmentId]);

  const submit = async () => {
    if (!name.trim() || !departmentId) return;
    try {
      await api.post("/skills", {
        name: name.trim(),
        description: description.trim(),
        department: departmentId,
      });
      toast.success("Compétence ajoutée au référentiel");
      setName("");
      setDescription("");
      setOpen(false);
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur lors de la création");
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/skills/${id}`);
      toast.success("Compétence supprimée");
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-6">
      <Panel
        title="Référentiel de compétences"
        description="Définissez les compétences évaluables par département"
        action={
          <PrimaryButton onClick={() => setOpen(true)}>
            <span className="inline-flex items-center gap-1.5">
              <Plus className="size-4" />
              Nouvelle compétence
            </span>
          </PrimaryButton>
        }
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
        <div className="space-y-5">
          {departments.map((d) => {
            const list = skills.filter((s) => s.department?.name === d.name);
            return (
              <div key={d.id}>
                <p className="mb-2 text-sm font-semibold">{d.name}</p>
                {list.length === 0 ? (
                  <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                    Aucune compétence définie pour ce département.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {list.map((s) => (
                      <li
                        key={s._id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                      >
                        <span className="text-sm">
                          <span className="font-medium">{s.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {s.description || "—"}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => void remove(s._id)}
                          className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                          Supprimer
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
        )}
      </Panel>

      <Modal
        open={open}
        title="Nouvelle compétence"
        description="Elle sera évaluable par les encadrants du département"
        onClose={() => setOpen(false)}
      >
        <div className="space-y-3">
          <Field label="Nom">
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tests unitaires"
            />
          </Field>
          <Field label="Description">
            <TextArea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Écrire et maintenir des tests fiables."
            />
          </Field>
          <Field label="Département">
            <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <GhostButton onClick={() => setOpen(false)}>Annuler</GhostButton>
            <PrimaryButton onClick={() => void submit()}>Créer</PrimaryButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------- Encadrant ------------------------------ */

type Draft = { level: SkillLevel | ""; comment: string };
type InternWithDept = { id: string; name: string; departmentId?: string };

function EncadrantSkills() {
  const [interns, setInterns] = useState<InternWithDept[]>([]);
  const [internsLoading, setInternsLoading] = useState(true);
  const [selected, setSelected] = useState("");
  const [deptSkills, setDeptSkills] = useState<ApiSkill[]>([]);
  const [evaluations, setEvaluations] = useState<ApiEvaluation[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  useEffect(() => {
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await api.get<any[]>("/users/my-stagiaires");
        const mapped = data.map((s) => ({
          id: s._id,
          name: `${s.firstName} ${s.lastName}`,
          departmentId: s.department?._id,
        }));
        setInterns(mapped);
        if (mapped[0]) setSelected(mapped[0].id);
      } catch {
        toast.error("Erreur lors du chargement de vos stagiaires");
      } finally {
        setInternsLoading(false);
      }
    })();
  }, []);

  const intern = interns.find((i) => i.id === selected);

  useEffect(() => {
    if (!intern?.departmentId) {
      setDeptSkills([]);
      return;
    }
    api
      .get<ApiSkill[]>(`/skills?department=${intern.departmentId}`)
      .then(setDeptSkills)
      .catch(() => toast.error("Erreur lors du chargement des compétences"));
  }, [intern?.departmentId]);

  useEffect(() => {
    setDrafts({});
    if (!selected) {
      setEvaluations([]);
      return;
    }
    api
      .get<ApiEvaluation[]>(`/skills/evaluations/${selected}`)
      .then(setEvaluations)
      .catch(() => toast.error("Erreur lors du chargement des évaluations"));
  }, [selected]);

  const current = (skillId: string) => evaluations.find((e) => e.skill._id === skillId);

  const setDraft = (skillId: string, patch: Partial<Draft>) =>
    setDrafts((prev) => ({
      ...prev,
      [skillId]: {
        level: patch.level ?? prev[skillId]?.level ?? current(skillId)?.level ?? "",
        comment: patch.comment ?? prev[skillId]?.comment ?? current(skillId)?.comment ?? "",
      },
    }));

  const saveAll = async () => {
    const entries = Object.entries(drafts).filter(([, d]) => d.level);
    if (entries.length === 0) {
      toast.error("Aucune modification à enregistrer.");
      return;
    }
    try {
      for (const [skillId, d] of entries) {
        // eslint-disable-next-line no-await-in-loop
        await api.post("/skills/evaluations", {
          stagiaire: selected,
          skill: skillId,
          level: d.level,
          comment: d.comment,
        });
      }
      toast.success("Évaluation enregistrée");
      setDrafts({});
      const data = await api.get<ApiEvaluation[]>(`/skills/evaluations/${selected}`);
      setEvaluations(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur lors de l'enregistrement");
    }
  };

  return (
    <div className="space-y-6">
      <Panel
        title="Compétences de mes stagiaires"
        description="Évaluez la progression sur le référentiel du département"
        action={<PrimaryButton onClick={() => void saveAll()}>Enregistrer l'évaluation</PrimaryButton>}
      >
        {internsLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
        <div className="space-y-4">
          <Field label="Stagiaire">
            <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
              {interns.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </Select>
          </Field>

          {deptSkills.length === 0 ? (
            <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              Aucune compétence définie. Contactez le RH.
            </p>
          ) : (
            <ul className="space-y-3">
              {deptSkills.map((s) => {
                const saved = current(s._id);
                const draft = drafts[s._id];
                const dirty =
                  !!draft &&
                  (draft.level !== (saved?.level ?? "") || draft.comment !== (saved?.comment ?? ""));
                return (
                  <li key={s._id} className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{s.name}</p>
                      {dirty ? (
                        <span
                          className="size-2 rounded-full bg-warning"
                          title="Modification non enregistrée"
                        />
                      ) : null}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {saved
                          ? `${saved.level} · ${new Date(saved.evaluatedAt).toLocaleDateString("fr-FR")}`
                          : "Non évalué"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Field label="Niveau">
                        <Select
                          value={draft?.level ?? saved?.level ?? ""}
                          onChange={(e) => setDraft(s._id, { level: e.target.value as SkillLevel })}
                        >
                          <option value="">Non évalué</option>
                          {skillLevels.map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Commentaire (optionnel)">
                        <TextInput
                          value={draft?.comment ?? saved?.comment ?? ""}
                          onChange={(e) => setDraft(s._id, { comment: e.target.value })}
                          placeholder="Observation…"
                        />
                      </Field>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        )}
      </Panel>
    </div>
  );
}

/* ------------------------------- Stagiaire ------------------------------ */

function StagiaireSkills() {
  const { user } = useSession();
  const [skills, setSkills] = useState<ApiSkill[]>([]);
  const [evaluations, setEvaluations] = useState<ApiEvaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const me = await api.get<any>("/auth/me");
        const deptId: string | undefined = me.department?._id;
        if (deptId) {
          const [skillsData, evalData] = await Promise.all([
            api.get<ApiSkill[]>(`/skills?department=${deptId}`),
            api.get<ApiEvaluation[]>(`/skills/evaluations/${user.id}`),
          ]);
          setSkills(skillsData);
          setEvaluations(evalData);
        }
      } catch {
        toast.error("Erreur lors du chargement de vos compétences");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  return (
    <div className="space-y-6">
      <Panel
        title="Ma progression"
        description="Niveaux attribués par votre encadrant (lecture seule)"
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : skills.length === 0 ? (
          <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            Aucune compétence définie pour votre département.
          </p>
        ) : (
          <ul className="space-y-4">
            {skills.map((s) => {
              const ev = evaluations.find((e) => e.skill._id === s._id);
              const pct = ev ? levelPercent[ev.level] : 0;
              return (
                <li key={s._id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{s.name}</p>
                    <span className="text-xs text-muted-foreground">
                      {ev ? `${ev.level} · ${pct}%` : "Non évalué"}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
                  </div>
                  {ev?.comment ? (
                    <p className="mt-1 text-xs text-muted-foreground">« {ev.comment} »</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}