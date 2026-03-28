import { useState, useEffect } from "react";
import { ArrowLeft, Globe, Save, RefreshCw, ImagePlus, X } from "lucide-react";
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

            <div className="space-y-2">
              <Label htmlFor="banner-url">URL de l'image</Label>
              <div className="flex gap-2">
                <Input
                  id="banner-url"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                  disabled={isReadOnly}
                  className="flex-1"
                />
                {bannerUrl && !isReadOnly && (
                  <Button variant="ghost" size="icon" onClick={() => setBannerUrl("")} className="shrink-0">
                    <X size={16} />
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Laisser vide pour un fond uni. Formats : JPG, PNG, WebP.
              </p>
            </div>

            {bannerUrl && (
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
            )}
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
