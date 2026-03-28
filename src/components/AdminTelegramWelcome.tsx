import { useState, useEffect } from "react";
import { Plus, Trash2, RefreshCw, Save, Image, MessageSquare, ExternalLink, AppWindow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
}

const AdminTelegramWelcome = () => {
  const [config, setConfig] = useState<WelcomeConfig>({
    image_url: "",
    message_text: "Bienvenue ! 👋",
    buttons: [],
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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
        });
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
      const { data, error } = await supabase.functions.invoke("admin-telegram", {
        body: {
          action: "save_welcome",
          session_token: sessionToken,
          image_url: config.image_url || null,
          message_text: config.message_text,
          buttons: config.buttons.filter((b) => b.text.trim() && b.url.trim()),
        },
      });
      if (error || data?.error) {
        toast.error(data?.error || "Erreur lors de la sauvegarde");
        return;
      }
      toast.success("Message d'accueil sauvegardé !");
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setSaving(false);
    }
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
        {/* Image */}
        <div className="space-y-2">
          <Label htmlFor="welcome-image" className="flex items-center gap-2">
            <Image size={14} />
            Image d'accueil (URL)
          </Label>
          <Input
            id="welcome-image"
            placeholder="https://example.com/welcome.jpg"
            value={config.image_url}
            onChange={(e) => setConfig((prev) => ({ ...prev, image_url: e.target.value }))}
            className="text-xs"
          />
          {config.image_url && (
            <div className="rounded-lg overflow-hidden border border-border mt-2">
              <img
                src={config.image_url}
                alt="Aperçu"
                className="w-full max-h-40 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="welcome-message" className="flex items-center gap-2">
            <MessageSquare size={14} />
            Message texte
          </Label>
          <Textarea
            id="welcome-message"
            placeholder="Bienvenue sur notre bot ! 👋"
            value={config.message_text}
            onChange={(e) => setConfig((prev) => ({ ...prev, message_text: e.target.value }))}
            className="text-sm min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground">
            Supporte le HTML : &lt;b&gt;gras&lt;/b&gt;, &lt;i&gt;italique&lt;/i&gt;, &lt;a href=""&gt;lien&lt;/a&gt;
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            Boutons interactifs
          </Label>

          {config.buttons.map((btn, index) => (
            <div key={index} className="p-3 rounded-lg border border-border bg-background/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  Bouton {index + 1}
                </span>
                <button
                  onClick={() => removeButton(index)}
                  className="text-destructive hover:text-destructive/80 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Input
                  placeholder="Texte du bouton"
                  value={btn.text}
                  onChange={(e) => updateButton(index, "text", e.target.value)}
                  className="text-xs"
                />
                <Select
                  value={btn.type}
                  onValueChange={(val) => updateButton(index, "type", val)}
                >
                  <SelectTrigger className="w-[110px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">
                      <span className="flex items-center gap-1">
                        <ExternalLink size={12} /> Lien
                      </span>
                    </SelectItem>
                    <SelectItem value="miniapp">
                      <span className="flex items-center gap-1">
                        <AppWindow size={12} /> Mini App
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Input
                placeholder={btn.type === "miniapp" ? "https://t.me/bot/app" : "https://example.com"}
                value={btn.url}
                onChange={(e) => updateButton(index, "url", e.target.value)}
                className="text-xs"
              />
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={addButton}
            className="w-full"
            disabled={config.buttons.length >= 6}
          >
            <Plus size={14} />
            Ajouter un bouton
          </Button>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Aperçu</Label>
          <div className="rounded-lg border border-border bg-[hsl(var(--muted))]/30 p-3 space-y-2">
            {config.image_url && (
              <div className="rounded overflow-hidden">
                <img
                  src={config.image_url}
                  alt=""
                  className="w-full max-h-32 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
            <p className="text-sm whitespace-pre-wrap">
              {config.message_text || "Bienvenue ! 👋"}
            </p>
            {config.buttons.filter((b) => b.text.trim()).length > 0 && (
              <div className="space-y-1 pt-1">
                {config.buttons
                  .filter((b) => b.text.trim())
                  .map((btn, i) => (
                    <div
                      key={i}
                      className="text-center py-1.5 rounded bg-primary/10 text-primary text-xs font-medium flex items-center justify-center gap-1"
                    >
                      {btn.type === "miniapp" ? <AppWindow size={12} /> : <ExternalLink size={12} />}
                      {btn.text}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Save */}
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          Sauvegarder
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminTelegramWelcome;
