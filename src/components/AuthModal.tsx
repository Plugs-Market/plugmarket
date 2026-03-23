import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTelegram } from "@/hooks/useTelegram";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LogIn, UserPlus, Key, Copy, Check, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type AuthView = "login" | "register-seed" | "register-details" | "recover";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultView?: "login" | "register";
}

const resolveInitialView = (defaultView: "login" | "register"): AuthView =>
  defaultView === "register" ? "register-seed" : "login";

const AuthModal = ({ open, onOpenChange, defaultView = "login" }: AuthModalProps) => {
  const { login, register, recover, generateSeed } = useAuth();
  const { user: telegramUser, isTelegram } = useTelegram();

  const [view, setView] = useState<AuthView>(resolveInitialView(defaultView));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [seedInput, setSeedInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setUsername("");
    setPassword("");
    setNewPassword("");
    setNewUsername("");
    setSeedInput("");
    setSeedPhrase("");
    setError("");
    setShowPassword(false);
    setCopied(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset();
      setView(resolveInitialView(defaultView));
    }
    onOpenChange(nextOpen);
  };

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      toast.success("Connecté avec succès !");
      handleOpenChange(false);
    } else {
      setError(result.error || "Erreur");
    }
  };

  const handleGenerateSeed = async () => {
    setError("");
    setLoading(true);
    const result = await generateSeed();
    setLoading(false);

    if (result.success && result.seed_phrase) {
      setSeedPhrase(result.seed_phrase);
      setCopied(false);
      toast.success("Phrase générée ! Sauvegardez-la avant de continuer.");
      return;
    }

    setError(result.error || "Impossible de générer la phrase de récupération");
  };

  const handleRegister = async () => {
    if (!seedPhrase) {
      setError("Générez et sauvegardez d'abord votre phrase de récupération");
      return;
    }

    setError("");
    setLoading(true);
    const result = await register(username, password, seedPhrase);

    if (!result.success) {
      setLoading(false);
      setError(result.error || "Erreur");
      return;
    }

    const loginResult = await login(username, password);
    setLoading(false);

    if (loginResult.success) {
      toast.success("Compte créé et connecté !");
      handleOpenChange(false);
    } else {
      toast.success("Compte créé avec succès ! Connectez-vous.");
      reset();
      setView("login");
    }
  };

  const handleRecover = async () => {
    setError("");
    setLoading(true);
    const result = await recover(
      seedInput,
      newPassword,
      newUsername,
      isTelegram ? telegramUser?.id : undefined,
    );
    setLoading(false);

    if (result.success) {
      toast.success("Compte récupéré ! Vous pouvez vous reconnecter.");
      setView("login");
      reset();
    } else {
      setError(result.error || "Erreur");
    }
  };

  const copySeed = () => {
    if (!seedPhrase) return;
    navigator.clipboard.writeText(seedPhrase);
    setCopied(true);
    toast.success("Phrase copiée !");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-primary/20">
        {view === "login" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground font-display flex items-center gap-2">
                <LogIn className="text-primary" size={22} />
                Connexion
              </DialogTitle>
              <DialogDescription>Entrez vos identifiants pour vous connecter</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {error && (
                <p className="text-destructive text-sm bg-destructive/10 p-2 rounded-lg">{error}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="login-username">Pseudo</Label>
                <Input
                  id="login-username"
                  placeholder="Votre pseudo"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-background border-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background border-primary/20 pr-10"
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <Button onClick={handleLogin} disabled={loading} className="w-full">
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
              <div className="flex justify-between text-sm">
                <button
                  onClick={() => {
                    reset();
                    setView("register-seed");
                  }}
                  className="text-primary hover:underline"
                >
                  Créer un compte
                </button>
                <button
                  onClick={() => {
                    reset();
                    setView("recover");
                  }}
                  className="text-muted-foreground hover:text-primary hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            </div>
          </>
        )}

        {view === "register-seed" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground font-display flex items-center gap-2">
                <Key className="text-primary" size={22} />
                Étape 1 · Clé de récupération
              </DialogTitle>
              <DialogDescription>
                Générez votre phrase unique de 16 mots, sauvegardez-la, puis continuez.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {error && (
                <p className="text-destructive text-sm bg-destructive/10 p-2 rounded-lg">{error}</p>
              )}
              {!seedPhrase ? (
                <Button onClick={handleGenerateSeed} disabled={loading} className="w-full">
                  {loading ? "Génération..." : "Générer ma phrase de récupération"}
                </Button>
              ) : (
                <>
                  <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-start gap-2">
                    <AlertTriangle className="text-destructive shrink-0 mt-0.5" size={18} />
                    <p className="text-sm text-destructive">
                      <strong>ATTENTION :</strong> Cette phrase est nécessaire pour récupérer votre compte.
                    </p>
                  </div>
                  <div className="bg-background rounded-xl p-4 border border-primary/30">
                    <div className="grid grid-cols-4 gap-2">
                      {seedPhrase.split(" ").map((word, i) => (
                        <div key={i} className="flex items-center gap-1 text-sm">
                          <span className="text-muted-foreground text-xs w-4">{i + 1}.</span>
                          <span className="text-foreground font-mono font-medium">{word}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button onClick={copySeed} variant="outline" className="w-full gap-2">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? "Copiée !" : "Copier la phrase"}
                  </Button>
                </>
              )}
              <Button
                onClick={() => {
                  setError("");
                  setView("register-details");
                }}
                disabled={!seedPhrase}
                className="w-full"
              >
                J'ai sauvegardé ma phrase
              </Button>
              <button
                onClick={() => {
                  reset();
                  setView("login");
                }}
                className="text-primary hover:underline text-sm w-full text-center"
              >
                Retour à la connexion
              </button>
            </div>
          </>
        )}

        {view === "register-details" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground font-display flex items-center gap-2">
                <UserPlus className="text-primary" size={22} />
                Étape 2 · Créer le compte
              </DialogTitle>
              <DialogDescription>
                Entrez votre pseudo et mot de passe pour finaliser l'inscription.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {error && (
                <p className="text-destructive text-sm bg-destructive/10 p-2 rounded-lg">{error}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="reg-username">Pseudo</Label>
                <Input
                  id="reg-username"
                  placeholder="Choisissez un pseudo (3-30 caractères)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-background border-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 caractères"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background border-primary/20 pr-10"
                    onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <Button onClick={handleRegister} disabled={loading} className="w-full">
                {loading ? "Création..." : "Créer mon compte"}
              </Button>
              <button
                onClick={() => setView("register-seed")}
                className="text-muted-foreground hover:text-primary hover:underline text-sm w-full text-center"
              >
                Retour à la phrase de récupération
              </button>
            </div>
          </>
        )}

        {view === "recover" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground font-display flex items-center gap-2">
                <Key className="text-primary" size={22} />
                Récupération
              </DialogTitle>
              <DialogDescription>
                Entrez votre phrase de récupération pour changer le mot de passe et, si besoin, le pseudo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {error && (
                <p className="text-destructive text-sm bg-destructive/10 p-2 rounded-lg">{error}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="recover-seed">Phrase de récupération (16 mots)</Label>
                <textarea
                  id="recover-seed"
                  placeholder="Entrez vos 16 mots séparés par des espaces..."
                  value={seedInput}
                  onChange={(e) => setSeedInput(e.target.value)}
                  className="flex w-full rounded-md border border-primary/20 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-24 resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recover-password">Nouveau mot de passe</Label>
                <Input
                  id="recover-password"
                  type="password"
                  placeholder="Min. 8 caractères"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-background border-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recover-username">Nouveau pseudo (optionnel)</Label>
                <Input
                  id="recover-username"
                  placeholder="Laissez vide pour garder le pseudo actuel"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="bg-background border-primary/20"
                />
              </div>
              {isTelegram && (
                <p className="text-xs text-muted-foreground">
                  Votre compte sera aussi rattaché à votre compte Telegram actuel.
                </p>
              )}
              <Button onClick={handleRecover} disabled={loading} className="w-full">
                {loading ? "Récupération..." : "Réinitialiser le mot de passe"}
              </Button>
              <button
                onClick={() => {
                  reset();
                  setView("login");
                }}
                className="text-primary hover:underline text-sm w-full text-center"
              >
                Retour à la connexion
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
