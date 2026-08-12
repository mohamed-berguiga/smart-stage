import { useEffect, useState } from "react";
import { FileText, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GhostButton, PrimaryButton } from "@/components/form-ui";
import { api, ApiError } from "@/lib/api";
import type { Account } from "@/lib/store";

type ApiAttestation = {
  _id: string;
  issueDate: string;
  startDate: string;
  endDate: string;
  fileUrl: string;
  status: string;
};

function frDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export function AttestationPanel({ intern }: { intern: Account }) {
  const [list, setList] = useState<ApiAttestation[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [generating, setGenerating] = useState(false);

  const endDate = intern.endDate;
  const finished = !!endDate && new Date(endDate) <= new Date();

  const refresh = async () => {
    setLoadingList(true);
    try {
      // Le PDF est réellement généré et stocké côté serveur (PDFKit) —
      // voir controllers/attestationController.js.
      const data = await api.get<ApiAttestation[]>(`/attestations/${intern.id}`);
      setList(data);
    } catch (err) {
      console.error("Erreur lors du chargement des attestations :", err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intern.id]);

  const openFile = (a: ApiAttestation) => {
    window.open(api.fileUrl(a.fileUrl), "_blank", "noopener");
  };

  const generate = async () => {
    setGenerating(true);
    try {
      // Le backend vérifie lui-même l'éligibilité (stage terminé) et renvoie
      // une erreur explicite sinon — pas besoin de dupliquer cette logique ici.
      const created = await api.post<ApiAttestation>(`/attestations/${intern.id}`);
      toast.success("Attestation générée");
      openFile(created);
      await refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <p className="text-sm font-semibold">Attestations générées</p>
      {loadingList ? (
        <p className="text-xs text-muted-foreground">Chargement…</p>
      ) : list.length === 0 ? (
        <p className="text-xs text-muted-foreground">Aucune attestation générée pour ce stagiaire.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((a) => (
            <li
              key={a._id}
              className="flex items-center justify-between gap-2 rounded-md bg-muted p-2 text-xs"
            >
              <span>
                <span className="font-medium">{frDate(a.issueDate)}</span>
                <span className="block text-muted-foreground">
                  {frDate(a.startDate)} → {frDate(a.endDate)}
                </span>
              </span>
              <GhostButton onClick={() => openFile(a)}>
                <span className="inline-flex items-center gap-1">
                  <Download className="size-3.5" />
                  Télécharger
                </span>
              </GhostButton>
            </li>
          ))}
        </ul>
      )}

      <div
        title={
          finished ? undefined : `Stage non terminé${endDate ? ` (fin prévue le ${endDate})` : ""}`
        }
      >
        <PrimaryButton onClick={() => void generate()} disabled={generating || !finished}>
          <span className="inline-flex items-center gap-2">
            {generating ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
            {generating ? "Génération…" : "Générer l'attestation"}
          </span>
        </PrimaryButton>
      </div>
      {!finished ? (
        <p className="text-xs text-warning-foreground">
          Attestation disponible après la fin du stage
          {endDate ? ` (fin prévue le ${frDate(endDate)})` : ""}.
        </p>
      ) : null}
    </div>
  );
}