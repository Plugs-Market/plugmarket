import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, RefreshCw, Save, Image, MessageSquare, ExternalLink, AppWindow, Upload, X, Code, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WelcomeButton {
  text: string;
  url: string;
  type: "link" | "miniapp";
}

interface WelcomeConfig {
  image_url: string;
  message_text: string;
  buttons: WelcomeButton[];
  captcha_enabled: boolean;
  captcha_message: string;
}

const TEMPLATE_TAGS = [
  { tag: "{first_name}", label: "Prénom", desc: "Prénom de l'utilisateur" },
  { tag: "{last_name}", label: "Nom", desc: "Nom de l'utilisateur" },
  { tag: "{username}", label: "Username", desc: "@username Telegram" },
  { tag: "{user_id}", label: "ID", desc: "ID numérique Telegram" },
  { tag: "{language}", label: "Langue", desc: "Code langue (fr, en...)" },
];

const CAPTCHA_TAGS = [
  { tag: "{captcha}", label: "Code Captcha", desc: "Sera remplacé par le code à entrer" },
  { tag: "{first_name}", label: "Prénom", desc: "Prénom de l'utilisateur" },
  { tag: "{username}", label: "Username", desc: "@username Telegram" },
];

const AdminTelegramWelcome = ({ onShowTelegramUsers, isReadOnly = false }: { onShowTelegramUsers?: () => void; isReadOnly?: boolean }) => {
  const [config, setConfig] = useState<WelcomeConfig>({
    image_url: "",
    message_text: "Bienvenue ! 👋",
    buttons: [],
    captcha_enabled: false,
    captcha_message: "Veuillez entrer le code affiché dans l'image : {captcha}",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const captchaTextareaRef = useRef<HTMLTextAreaElement>(null);

  const sessionToken = localStorage.getItem("plugs_market_token");

  useEffect(() => {
    loadWelcome();
  }, []);

  const loadWelcome = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke("admin-telegram", {
        body: { action: "get_welcome", session_token: sessionToken },
      });
      if (data?.welcome) {
        setConfig({
          image_url: data.welcome.image_url || "",
          message_text: data.welcome.message_text || "Bienvenue ! 👋",
          buttons: (data.welcome.buttons as WelcomeButton[]) || [],
          captcha_enabled: data.welcome.captcha_enabled || false,
          captcha_message: data.welcome.captcha_message || "Veuillez entrer le code affiché dans l'image : {captcha}",
        });
        if (data.welcome.image_url) {
          setImagePreview(data.welcome.image_url);
        }
      }
    } catch {
      // defaults
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const filteredButtons = config.buttons.filter((b) => b.text.trim() && b.url.trim());

      if (imageFile) {
        const formData = new FormData();
        formData.append("action", "save_welcome");
        formData.append("session_token", sessionToken || "");
        formData.append("message_text", config.message_text);
        formData.append("buttons", JSON.stringify(filteredButtons));
        formData.append("image_file", imageFile);
        formData.append("captcha_enabled", String(config.captcha_enabled));
        formData.append("captcha_message", config.captcha_message);

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-telegram`,
          {
            method: "POST",
            headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
            body: formData,
          }
        );
        const data = await res.json();
        if (!res.ok || data?.error) {
          toast.error(data?.error || "Erreur lors de la sauvegarde");
          return;
        }
        if (data.image_url) {
          setConfig((prev) => ({ ...prev, image_url: data.image_url }));
          setImagePreview(data.image_url);
          setImageFile(null);
        }
      } else {
        const { data, error } = await supabase.functions.invoke("admin-telegram", {
          body: {
            action: "save_welcome",
            session_token: sessionToken,
            image_url: config.image_url || null,
            message_text: config.message_text,
            buttons: filteredButtons,
            remove_image: !config.image_url && !imagePreview ? true : undefined,
            captcha_enabled: config.captcha_enabled,
            captcha_message: config.captcha_message,
          },
        });
        if (error || data?.error) {
          toast.error(data?.error || "Erreur lors de la sauvegarde");
          return;
        }
      }
      toast.success("Message d'accueil sauvegardé !");
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    setConfig((prev) => ({ ...prev, image_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const insertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setConfig((prev) => ({ ...prev, message_text: prev.message_text + tag }));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = config.message_text;
    const newText = text.substring(0, start) + tag + text.substring(end);
    setConfig((prev) => ({ ...prev, message_text: newText }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  const insertCaptchaTag = (tag: string) => {
    const textarea = captchaTextareaRef.current;
    if (!textarea) {
      setConfig((prev) => ({ ...prev, captcha_message: prev.captcha_message + tag }));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = config.captcha_message;
    const newText = text.substring(0, start) + tag + text.substring(end);
    setConfig((prev) => ({ ...prev, captcha_message: newText }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  const addButton = () => {
    if (config.buttons.length >= 6) {
      toast.error("Maximum 6 boutons");
      return;
    }
    setConfig((prev) => ({
      ...prev,
      buttons: [...prev.buttons, { text: "", url: "", type: "link" }],
    }));
  };

  const updateButton = (index: number, field: keyof WelcomeButton, value: string) => {
    setConfig((prev) => ({
      ...prev,
      buttons: prev.buttons.map((b, i) => (i === index ? { ...b, [field]: value } : b)),
    }));
  };

  const removeButton = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <Card className="bg-card card-neon-border">
        <CardContent className="py-8 text-center text-muted-foreground">
          <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
          Chargement...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Welcome Message Card */}
      <Card className="bg-card card-neon-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare size={18} className="text-primary" />
            Message d'accueil (/start)
          </CardTitle>
          <CardDescription>
            Personnalisez le message envoyé quand un utilisateur démarre le bot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Image size={14} />
              Image d'accueil
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img src={imagePreview} alt="Aperçu" className="w-full max-h-40 object-cover" />
                {!isReadOnly && (
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1.5 text-destructive hover:bg-background transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ) : !isReadOnly ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              >
                <Upload size={24} />
                <span className="text-xs font-medium">Cliquer pour uploader une image</span>
                <span className="text-xs opacity-60">JPG, PNG, WEBP • Max 5 Mo</span>
              </button>
            ) : (
              <p className="text-xs text-muted-foreground">Aucune image configurée</p>
            )}
            {!isReadOnly && imagePreview && (
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="w-full text-xs">
                <Upload size={12} />
                Changer l'image
              </Button>
            )}
          </div>

          {/* Message with template tags */}
          <div className="space-y-2">
            <Label htmlFor="welcome-message" className="flex items-center gap-2">
              <MessageSquare size={14} />
              Message texte
            </Label>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Code size={12} />
                <span>Balises dynamiques :</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_TAGS.map((t) => (
                  <button
                    key={t.tag}
                    onClick={() => insertTag(t.tag)}
                    className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-mono hover:bg-primary/20 transition-colors"
                    title={t.desc}
                  >
                    {t.tag}
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              id="welcome-message"
              ref={textareaRef}
              placeholder="Bienvenue {first_name} sur notre bot ! 👋"
              value={config.message_text}
              onChange={(e) => setConfig((prev) => ({ ...prev, message_text: e.target.value }))}
              className="text-sm min-h-[100px] font-mono"
              disabled={isReadOnly}
            />
            <p className="text-xs text-muted-foreground">
              HTML : &lt;b&gt;gras&lt;/b&gt;, &lt;i&gt;italique&lt;/i&gt;, &lt;a href=""&gt;lien&lt;/a&gt;
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">Boutons interactifs</Label>
            {config.buttons.map((btn, index) => (
              <div key={index} className="p-3 rounded-lg border border-border bg-background/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Bouton {index + 1}</span>
                  {!isReadOnly && (
                    <button onClick={() => removeButton(index)} className="text-destructive hover:text-destructive/80 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <Input placeholder="Texte du bouton" value={btn.text} onChange={(e) => updateButton(index, "text", e.target.value)} className="text-xs" disabled={isReadOnly} />
                  <Select value={btn.type} onValueChange={(val) => updateButton(index, "type", val)} disabled={isReadOnly}>
                    <SelectTrigger className="w-[110px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="link"><span className="flex items-center gap-1"><ExternalLink size={12} /> Lien</span></SelectItem>
                      <SelectItem value="miniapp"><span className="flex items-center gap-1"><AppWindow size={12} /> Mini App</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder={btn.type === "miniapp" ? "https://t.me/bot/app" : "https://example.com"}
                  value={btn.url}
                  onChange={(e) => updateButton(index, "url", e.target.value)}
                  className="text-xs"
                  disabled={isReadOnly}
                />
              </div>
            ))}
            {!isReadOnly && (
              <Button variant="outline" size="sm" onClick={addButton} className="w-full" disabled={config.buttons.length >= 6}>
                <Plus size={14} />
                Ajouter un bouton
              </Button>
            )}
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Aperçu</Label>
            <div className="rounded-lg border border-border bg-[hsl(var(--muted))]/30 p-3 space-y-2">
              {imagePreview && (
                <div className="rounded overflow-hidden">
                  <img src={imagePreview} alt="" className="w-full max-h-32 object-cover" />
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">
                {(config.message_text || "Bienvenue ! 👋")
                  .replace(/\{first_name\}/g, "Jean")
                  .replace(/\{last_name\}/g, "Dupont")
                  .replace(/\{username\}/g, "@jean_dupont")
                  .replace(/\{user_id\}/g, "123456789")
                  .replace(/\{language\}/g, "fr")}
              </p>
              {config.buttons.filter((b) => b.text.trim()).length > 0 && (
                <div className="space-y-1 pt-1">
                  {config.buttons.filter((b) => b.text.trim()).map((btn, i) => (
                    <div key={i} className="text-center py-1.5 rounded bg-primary/10 text-primary text-xs font-medium flex items-center justify-center gap-1">
                      {btn.type === "miniapp" ? <AppWindow size={12} /> : <ExternalLink size={12} />}
                      {btn.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Save */}
          {!isReadOnly && (
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              Sauvegarder
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Captcha Card */}
      <Card className="bg-card card-neon-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" />
            Captcha de vérification
          </CardTitle>
          <CardDescription>
            Demandez aux utilisateurs de valider un captcha avant de recevoir le message d'accueil
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Activer le captcha</Label>
              <p className="text-xs text-muted-foreground">
                Un code unique sera envoyé en image à chaque /start
              </p>
            </div>
            <Switch
              checked={config.captcha_enabled}
              onCheckedChange={(checked) =>
                setConfig((prev) => ({ ...prev, captcha_enabled: checked }))
              }
              disabled={isReadOnly}
            />
          </div>

          {config.captcha_enabled && (
            <>
              {/* Captcha message */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageSquare size={14} />
                  Message du captcha
                </Label>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Code size={12} />
                    <span>Balises disponibles :</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {CAPTCHA_TAGS.map((t) => (
                      <button
                        key={t.tag}
                        onClick={() => insertCaptchaTag(t.tag)}
                        className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-mono hover:bg-primary/20 transition-colors"
                        title={t.desc}
                      >
                        {t.tag}
                      </button>
                    ))}
                  </div>
                </div>
                <Textarea
                  ref={captchaTextareaRef}
                  placeholder="Entrez le code affiché dans l'image pour continuer..."
                  value={config.captcha_message}
                  onChange={(e) => setConfig((prev) => ({ ...prev, captcha_message: e.target.value }))}
                  className="text-sm min-h-[80px] font-mono"
                  disabled={isReadOnly}
                />
                <p className="text-xs text-muted-foreground">
                  ⚠️ La balise <code className="text-primary font-mono">{"{captcha}"}</code> affiche le code en format copiable (<code>&lt;code&gt;</code>) dans le message Telegram.
                </p>
              </div>

              {/* Captcha preview */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Aperçu du captcha</Label>
                <div className="rounded-lg border border-border bg-[hsl(var(--muted))]/30 p-3 space-y-2">
                  <div className="rounded overflow-hidden bg-muted flex items-center justify-center py-4">
                    <div className="px-6 py-3 bg-background/80 rounded border border-border font-mono text-lg tracking-[0.3em] font-bold text-foreground">
                      A7K9P
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {(config.captcha_message || "Entrez le code :")
                      .replace(/\{captcha\}/g, "A7K9P")
                      .replace(/\{first_name\}/g, "Jean")
                      .replace(/\{username\}/g, "@jean_dupont")}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Save */}
          {!isReadOnly && (
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              Sauvegarder
            </Button>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default AdminTelegramWelcome;
