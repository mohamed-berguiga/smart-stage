import { useRef, useState } from "react";
import { AlertTriangle, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { GhostButton, Modal, PrimaryButton, Select, TextInput } from "@/components/form-ui";
import { useStore } from "@/lib/store";
import { api, ApiError } from "@/lib/api";

type Row = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
};

type ImportErrorRow = { rowNumber: number; errorMessage: string };

const HEADERS = ["firstName", "lastName", "email", "phone", "password"];
const ACCEPTED = [".xlsx", ".xls", ".csv"];

const cell = (v: unknown) => (v === undefined || v === null ? "" : String(v).trim());

async function sheetjs() {
  return await import("xlsx");
}

export function ImportStagiairesModal({
  open,
  onClose,
  supervisors,
}: {
  open: boolean;
  onClose: () => void;
  /** Liste des encadrants avec leur vrai id MongoDB (pour créer l'affectation Stage). */
  supervisors: { id: string; name: string }[];
}) {
  const { departments } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [departmentId, setDepartmentId] = useState("");
  const [supervisorId, setSupervisorId] = useState(supervisors[0]?.id ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [result, setResult] = useState<{
    totalRows: number;
    successCount: number;
    errorCount: number;
    errors: ImportErrorRow[];
  } | null>(null);

  const reset = () => {
    setStep(1);
    setRows([]);
    setFile(null);
    setFileName("");
    setResult(null);
    setBusy(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const downloadTemplate = async () => {
    const XLSX = await sheetjs();
    const ws = XLSX.utils.aoa_to_sheet([
      HEADERS,
      ["Mohamed", "Berguiga", "mohamed@exemple.com", "+216 20 000 000", "motdepasse123"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stagiaires");
    XLSX.writeFile(wb, "modele-import-stagiaires.xlsx");
  };

  const pickFile = async (selectedFile: File) => {
    const lower = selectedFile.name.toLowerCase();
    if (!ACCEPTED.some((ext) => lower.endsWith(ext))) {
      toast.error("Format non supporté. Utilisez un fichier .xlsx, .xls ou .csv.");
      return;
    }
    setBusy(true);
    try {
      // Parsing 100% côté client, uniquement pour l'aperçu (étape 2) — le
      // fichier original est ensuite envoyé tel quel au backend, qui refait
      // sa propre validation ligne par ligne (source de vérité).
      const XLSX = await sheetjs();
      const wb = XLSX.read(await selectedFile.arrayBuffer(), { type: "array" });
      const first = wb.SheetNames[0];
      const sheet = first ? wb.Sheets[first] : undefined;
      const raw = sheet
        ? (XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<string, unknown>[])
        : [];
      if (raw.length === 0) {
        toast.error("Fichier vide. Vérifiez le modèle téléchargeable.");
        return;
      }
      const keys = Object.keys(raw[0] ?? {});
      const missing = ["firstName", "lastName", "email", "password"].filter(
        (h) => !keys.includes(h),
      );
      if (missing.length) {
        toast.error(`Colonnes manquantes : ${missing.join(", ")}. Vérifiez le modèle.`);
        return;
      }
      setRows(
        raw.map((r) => ({
          firstName: cell(r["firstName"]),
          lastName: cell(r["lastName"]),
          email: cell(r["email"]),
          phone: cell(r["phone"]),
          password: cell(r["password"]),
        })),
      );
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setStep(2);
    } catch {
      toast.error("Lecture du fichier impossible. Vérifiez le modèle téléchargeable.");
    } finally {
      setBusy(false);
    }
  };

  const invalid = (r: Row) => !r.firstName || !r.lastName || !r.email || !r.password;

  const confirmImport = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (departmentId) formData.append("department", departmentId);
      if (supervisorId) formData.append("encadrant", supervisorId);
      if (startDate) formData.append("startDate", startDate);
      if (endDate) formData.append("endDate", endDate);

      const data = await api.upload<{
        totalRows: number;
        successCount: number;
        errorCount: number;
        errors: ImportErrorRow[];
      }>("/imports/stagiaires", formData);

      setResult(data);
      setStep(3);
      toast.success(`${data.successCount} compte(s) créé(s), ${data.errorCount} erreur(s).`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur lors de l'import");
    } finally {
      setBusy(false);
    }
  };

  const downloadErrors = async () => {
    if (!result) return;
    const XLSX = await sheetjs();
    const ws = XLSX.utils.json_to_sheet(result.errors);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Erreurs");
    XLSX.writeFile(wb, "rapport-erreurs-import.xlsx");
  };

  return (
    <Modal
      open={open}
      title="Importer des stagiaires en masse"
      description={`Étape ${step} sur 3`}
      onClose={close}
    >
      {step === 1 ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const droppedFile = e.dataTransfer.files[0];
              if (droppedFile) void pickFile(droppedFile);
            }}
            className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary hover:bg-primary/5"
          >
            {busy ? (
              <Loader2 className="size-6 animate-spin text-primary" />
            ) : (
              <Upload className="size-6 text-primary" />
            )}
            <span className="text-sm font-medium">Déposez votre fichier ou choisissez-le</span>
            <span className="text-xs text-muted-foreground">Formats acceptés : .xlsx, .xls, .csv</span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            className="hidden"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0];
              if (selectedFile) void pickFile(selectedFile);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => void downloadTemplate()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Download className="size-4" />
            Télécharger le modèle
          </button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <FileSpreadsheet className="size-4 text-primary" />
            {fileName} · {rows.length} ligne(s)
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Département</span>
              <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Encadrant</span>
              <Select value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)}>
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Début du stage</span>
              <TextInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Fin du stage</span>
              <TextInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            Département, encadrant et dates s'appliquent à tous les stagiaires de ce fichier.
          </p>
          <div className="max-h-64 overflow-auto rounded-lg border border-border">
            <table className="w-full min-w-[34rem] text-xs">
              <thead className="bg-muted text-left uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-2">#</th>
                  {HEADERS.map((h) => (
                    <th key={h} className="p-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className={
                      invalid(r)
                        ? "bg-destructive/10 text-destructive"
                        : "border-t border-border/60"
                    }
                  >
                    <td className="p-2 tabular-nums">{i + 2}</td>
                    <td className="p-2">{r.firstName}</td>
                    <td className="p-2">{r.lastName}</td>
                    <td className="p-2">{r.email}</td>
                    <td className="p-2">{r.phone}</td>
                    <td className="p-2">{r.password ? "••••••" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {busy ? (
            <p className="inline-flex items-center gap-2 text-xs text-warning-foreground">
              <AlertTriangle className="size-4" />
              Import en cours, ne fermez pas cette fenêtre.
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <GhostButton onClick={() => setStep(1)}>Retour</GhostButton>
            <PrimaryButton onClick={() => void confirmImport()} disabled={busy}>
              {busy ? "Import en cours…" : "Confirmer l'import"}
            </PrimaryButton>
          </div>
        </div>
      ) : null}

      {step === 3 && result ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-semibold">
              {result.successCount} compte(s) créé(s) avec succès, {result.errorCount} erreur(s).
            </p>
            <p className="text-xs text-muted-foreground">{result.totalRows} ligne(s) traitée(s)</p>
          </div>
          {result.errorCount > 0 ? (
            <>
              <div className="max-h-56 overflow-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted text-left uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="p-2">Ligne</th>
                      <th className="p-2">Erreur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((e) => (
                      <tr key={e.rowNumber} className="border-t border-border/60">
                        <td className="p-2 tabular-nums">{e.rowNumber}</td>
                        <td className="p-2 text-destructive">{e.errorMessage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={() => void downloadErrors()}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <Download className="size-4" />
                Télécharger le rapport d'erreurs
              </button>
            </>
          ) : null}
          <div className="flex justify-end gap-2">
            <GhostButton onClick={reset}>Nouvel import</GhostButton>
            <PrimaryButton onClick={close}>Terminer</PrimaryButton>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}