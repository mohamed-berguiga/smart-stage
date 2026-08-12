import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Panel } from "@/components/dashboard-ui";
import { Field, PrimaryButton, TextInput } from "@/components/form-ui";
import { useSession } from "@/lib/session";
import { api, ApiError } from "@/lib/api";

export const Route = createFileRoute("/dashboard/profil")({
  head: () => ({
    meta: [{ title: "Mon profil — Smart Stage" }],
  }),
  component: ProfilPage,
});

function ProfilPage() {
  const { user, role } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user || !role) return null;

  const submit = async () => {
    if (newPassword.length < 6) {
      toast.error("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirm) {
      toast.error("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      await api.patch("/auth/change-password", { currentPassword, newPassword });
      toast.success("Mot de passe modifié avec succès");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur lors du changement de mot de passe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Panel title="Mon profil" description="Informations de votre compte">
        <ul className="space-y-1.5 text-sm">
          <li>
            Nom : <span className="font-medium">{user.firstName} {user.lastName}</span>
          </li>
          <li>
            Email : <span className="font-medium">{user.email}</span>
          </li>
          <li>
            Rôle : <span className="font-medium">{role}</span>
          </li>
          {user.department ? (
            <li>
              Département : <span className="font-medium">{user.department.name}</span>
            </li>
          ) : null}
        </ul>
      </Panel>

      <Panel title="Changer mon mot de passe" description="Chaque utilisateur peut modifier son propre mot de passe">
        <div className="max-w-sm space-y-3">
          <Field label="Mot de passe actuel">
            <TextInput
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Field label="Nouveau mot de passe">
            <TextInput
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 caractères"
            />
          </Field>
          <Field label="Confirmer le nouveau mot de passe">
            <TextInput
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <PrimaryButton onClick={() => void submit()} disabled={loading}>
            {loading ? "Enregistrement..." : "Mettre à jour le mot de passe"}
          </PrimaryButton>
        </div>
      </Panel>
    </div>
  );
}