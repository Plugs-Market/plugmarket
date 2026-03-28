import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, User, Shield, Hash, Lock, Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";

interface SettingsPageProps {
  onBack: () => void;
}

const SettingsPage = ({ onBack }: SettingsPageProps) => {
  const { user, recover } = useAuth();

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSeed, setShowSeed] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const initials = user.username.slice(0, 2).toUpperCase();

  const infoItems = [
    { icon: Hash, label: "Identifiant", value: user.id.slice(0, 8) + "…" },
    { icon: User, label: "Nom d'utilisateur", value: user.username },
    { icon: Shield, label: "Grade", value: user.grade || "membre" },
  ];

  const handleChangePassword = async () => {
    if (!seedPhrase.trim()) {
      toast.error("Veuillez entrer votre phrase de récupération");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    const result = await recover(seedPhrase, newPassword);
    setLoading(false);

    if (result.success) {
      toast.success("Mot de passe modifié avec succès");
      setSeedPhrase("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } else {
      toast.error(result.error || "Erreur lors de la modification");
    }
  };

  return (
    <div className="px-4 py-6 pb-28 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft size={20} />
        </Button>
        <h2 className="font-display text-2xl font-bold neon-text">Paramètres</h2>
      </div>

      <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card card-neon-border mb-6">
        <Avatar className="h-20 w-20 ring-2 ring-primary/30">
          <AvatarFallback className="bg-primary/20 text-primary font-display text-xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <p className="text-foreground font-semibold text-lg">{user.username}</p>
        <span className="px-3 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wide">
          {user.grade || "membre"}
        </span>
      </div>

      <div className="space-y-3 mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Informations du compte
        </h3>
        {infoItems.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-center gap-4 p-4 rounded-xl bg-card card-neon-border"
          >
            <Icon className="text-primary shrink-0" size={20} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-foreground font-medium truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Seed phrase reminder */}
      <div className="p-4 rounded-xl bg-card card-neon-border mb-6">
        <div className="flex items-center gap-3 mb-2">
          <KeyRound className="text-primary shrink-0" size={20} />
          <h3 className="text-sm font-semibold text-foreground">Phrase de récupération</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Votre phrase de récupération (16 mots) est le seul moyen de récupérer votre compte.
          Elle vous a été fournie lors de l'inscription. <strong className="text-foreground">Conservez-la précieusement</strong> — elle ne peut pas être réaffichée.
        </p>
      </div>

      {/* Change password section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Sécurité
        </h3>

        {!showPasswordForm ? (
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto p-4 rounded-xl"
            onClick={() => setShowPasswordForm(true)}
          >
            <Lock className="text-primary shrink-0" size={20} />
            <span className="text-foreground font-medium">Modifier le mot de passe</span>
          </Button>
        ) : (
          <div className="p-4 rounded-xl bg-card card-neon-border space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Lock className="text-primary" size={16} />
                Modifier le mot de passe
              </h4>
              <Button variant="ghost" size="sm" onClick={() => setShowPasswordForm(false)}>
                Annuler
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Phrase de récupération
                </label>
                <div className="relative">
                  <Input
                    type={showSeed ? "text" : "password"}
                    placeholder="Entrez vos 16 mots…"
                    value={seedPhrase}
                    onChange={(e) => setSeedPhrase(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSeed(!showSeed)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showSeed ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <Input
                    type={showNewPass ? "text" : "password"}
                    placeholder="Min. 8 caractères"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Confirmer le mot de passe
                </label>
                <Input
                  type="password"
                  placeholder="Confirmez le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Modification…" : "Confirmer la modification"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
