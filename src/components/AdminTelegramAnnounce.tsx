import { useState, useRef } from "react";
import { ArrowLeft, Megaphone, ImagePlus, X, Plus, Trash2, Send, RefreshCw, Link2, AppWindow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AnnounceButton {
  text: string;
  url: string;
  type: "url" | "web_app";
}

interface AdminTelegramAnnounceProps {
  onBack: () => void;
}

const MAX_BUTTONS = 6;

const AdminTelegramAnnounce = ({ onBack }: AdminTelegramAnnounceProps) => {
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [buttons, setButtons] = useState<AnnounceButton[]>([]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image trop volumineuse (max 10 Mo)");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addButton = () => {
    if (buttons.length >= MAX_BUTTONS) return;
    setButtons([...buttons, { text: "", url: "", type: "url" }]);
  };

  const updateButton = (index: number, field: keyof AnnounceButton, value: string) => {
    const updated = [...buttons];
    updated[index] = { ...updated[index], [field]: value };
    setButtons(updated);
  };

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const toggleButtonType = (index: number) => {
    const updated = [...buttons];
    updated[index] = { ...updated[index], type: updated[index].type === "url" ? "web_app" : "url" };
    setButtons(updated);
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Écrivez un message avant d'envoyer");
      return;
    }

    const validButtons = buttons.filter(b => b.text.trim() && b.url.trim());

    if (!confirm(`Envoyer cette annonce à tous les utilisateurs Telegram ?`)) return;

    setSending(true);
    setResult(null);

    try {
      const token = localStorage.getItem("plugs_market_token");
      const formData = new FormData();
      formData.append("action", "broadcast");
      formData.append("session_token", token || "");
      formData.append("message_text", message.trim());
      formData.append("buttons", JSON.stringify(validButtons));

      if (imageFile) {
        formData.append("image_file", imageFile);
      }

      const { data, error } = await supabase.functions.invoke("admin-telegram", {
        body: formData,
      });

      if (error || data?.error) {
        toast.error(data?.error || "Erreur lors de l'envoi");
        return;
      }

      setResult({ sent: data.sent || 0, failed: data.failed || 0 });
      toast.success(`Annonce envoyée à ${data.sent} utilisateur${data.sent > 1 ? "s" : ""}`);
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="px-4 py-6 pb-28 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </button>
        <Megaphone className="text-primary" size={24} />
        <h2 className="font-display text-xl font-bold neon-text">Message d'Annonces</h2>
      </div>

      <Card className="mb-4 bg-card card-neon-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Composer l'annonce</CardTitle>
          <CardDescription>
            Ce message sera envoyé à tous les utilisateurs ayant démarré le bot.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Image (optionnel)</Label>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-border">
                <img src={imagePreview} alt="Aperçu" className="w-full max-h-48 object-cover" />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-28 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <ImagePlus size={24} />
                <span className="text-xs font-medium">Ajouter une image</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="announce-msg">Message *</Label>
            <Textarea
              id="announce-msg"
              placeholder="Écrivez votre annonce ici...&#10;&#10;Supporte le HTML: <b>gras</b>, <i>italique</i>, <code>code</code>"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] [font-size:16px_!important]"
            />
            <p className="text-xs text-muted-foreground">
              HTML supporté : &lt;b&gt;, &lt;i&gt;, &lt;u&gt;, &lt;code&gt;, &lt;a href="..."&gt;
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Boutons ({buttons.length}/{MAX_BUTTONS})</Label>
              {buttons.length < MAX_BUTTONS && (
                <Button variant="outline" size="sm" onClick={addButton} className="text-xs gap-1">
                  <Plus size={14} />
                  Ajouter
                </Button>
              )}
            </div>

            {buttons.map((btn, i) => (
              <div key={i} className="p-3 rounded-lg bg-secondary/50 border border-border space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium shrink-0">#{i + 1}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleButtonType(i)}
                    className="text-xs gap-1 shrink-0"
                  >
                    {btn.type === "url" ? <Link2 size={12} /> : <AppWindow size={12} />}
                    {btn.type === "url" ? "Lien" : "Mini App"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeButton(i)}
                    className="ml-auto text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
                <Input
                  placeholder="Texte du bouton"
                  value={btn.text}
                  onChange={(e) => updateButton(i, "text", e.target.value)}
                  className="text-sm"
                />
                <Input
                  placeholder={btn.type === "url" ? "https://example.com" : "https://t.me/bot/app"}
                  value={btn.url}
                  onChange={(e) => updateButton(i, "url", e.target.value)}
                  className="text-sm font-mono"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card className="mb-4 bg-card card-neon-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-green-400 font-semibold">✓ {result.sent} envoyé{result.sent > 1 ? "s" : ""}</span>
              {result.failed > 0 && (
                <span className="text-destructive font-semibold">✗ {result.failed} échoué{result.failed > 1 ? "s" : ""}</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Send */}
      <Button
        onClick={handleSend}
        disabled={sending || !message.trim()}
        className="w-full gap-2"
        size="lg"
      >
        {sending ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
        {sending ? "Envoi en cours..." : "Envoyer l'annonce"}
      </Button>
    </div>
  );
};

export default AdminTelegramAnnounce;
