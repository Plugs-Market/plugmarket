import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Globe, Save, RefreshCw, ImagePlus, X, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminWebsiteProps {
  onBack: () => void;
  isReadOnly?: boolean;
}

const AdminWebsite = ({ onBack, isReadOnly = false }: AdminWebsiteProps) => {
  const [siteTitle, setSiteTitle] = useState("");
  const [siteSlogan, setSiteSlogan] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sessionToken = localStorage.getItem("plugs_market_token");

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-website", {
        body: { action: "get_settings" },
      });
      if (!error && data?.success && data.settings) {
        setSiteTitle(data.settings.site_title || "");
        setSiteSlogan(data.settings.site_slogan || "");
        setBannerUrl(data.settings.banner_url || "");
      }
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpload = async (file: File) => {
    if (!sessionToken) { toast.error("Non authentifié"); return; }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Format non supporté (JPG, PNG, WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 5 Mo)");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("action", "upload_banner");
      formData.append("session_token", sessionToken);
      formData.append("file", file);

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/admin-website`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );

      const data = await res.json();
      if (data.success && data.banner_url) {
        setBannerUrl(data.banner_url);
        toast.success("Bannière uploadée !");
      } else {
        toast.error(data.error || "Erreur d'upload");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveBanner = async () => {
    if (!sessionToken) return;
    setUploading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-website", {
        body: { action: "remove_banner", session_token: sessionToken },
      });
      if (!error && data?.success) {
        setBannerUrl("");
        toast.success("Bannière supprimée");
      } else {
        toast.error(data?.error || "Erreur");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (isReadOnly) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-website", {
        body: {
          action: "update_settings",
          session_token: sessionToken,
          site_title: siteTitle,
          site_slogan: siteSlogan,
          banner_url: bannerUrl || null,
        },
      });
      if (error || !data?.success) {
        toast.error(data?.error || "Erreur");
        return;
      }
      toast.success("Paramètres enregistrés");
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 py-6 pb-28 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft size={20} />
        </Button>
        <Globe className="text-primary" size={24} />
        <h2 className="font-display text-xl font-bold neon-text">Website</h2>
        <Button variant="ghost" size="icon" onClick={fetchSettings} className="ml-auto shrink-0">
          <RefreshCw size={18} />
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-12">Chargement...</p>
      ) : (
        <div className="space-y-6">
          {/* Header Section */}
          <div className="p-4 rounded-xl bg-card card-neon-border space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Globe size={16} className="text-primary" />
              En-tête du site
            </h3>

            <div className="space-y-2">
              <Label htmlFor="site-title">Titre du site</Label>
              <Input
                id="site-title"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                placeholder="PLUGS MARKET"
                disabled={isReadOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site-slogan">Slogan</Label>
              <Input
                id="site-slogan"
                value={siteSlogan}
                onChange={(e) => setSiteSlogan(e.target.value)}
                placeholder="DEMO TESTING APP"
                disabled={isReadOnly}
              />
            </div>
          </div>

          {/* Banner Section */}
          <div className="p-4 rounded-xl bg-card card-neon-border space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ImagePlus size={16} className="text-primary" />
              Bannière d'arrière-plan
            </h3>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = "";
              }}
            />

            {!bannerUrl ? (
              <button
                type="button"
                disabled={isReadOnly || uploading}
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 size={24} className="animate-spin text-primary" />
                ) : (
                  <>
                    <Upload size={24} />
                    <span className="text-xs">Cliquez pour uploader une image</span>
                    <span className="text-[10px]">JPG, PNG, WebP · Max 5 Mo</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img
                    src={bannerUrl}
                    alt="Aperçu bannière"
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
                    <span className="font-display text-lg font-black tracking-wider text-white">
                      {siteTitle || "TITRE"}
                    </span>
                    <span className="text-white/70 text-[10px] tracking-widest uppercase">
                      {siteSlogan || "SLOGAN"}
                    </span>
                  </div>
                </div>

                {!isReadOnly && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      Changer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      onClick={handleRemoveBanner}
                      disabled={uploading}
                    >
                      <X size={14} />
                      Supprimer
                    </Button>
                  </div>
                )}
              </div>
            )}

            <p className="text-[10px] text-muted-foreground">
              Laisser vide pour un fond uni. Formats : JPG, PNG, WebP.
            </p>
          </div>

          {!isReadOnly && (
            <Button className="w-full gap-2" onClick={handleSave} disabled={saving}>
              <Save size={16} />
              {saving ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminWebsite;
