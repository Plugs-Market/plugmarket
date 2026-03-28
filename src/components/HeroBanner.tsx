import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const HeroBanner = () => {
  const [title, setTitle] = useState("PLUGS MARKET");
  const [slogan, setSlogan] = useState("DEMO TESTING APP");
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.functions.invoke("admin-website", { body: { action: "get_settings" } }).then(({ data }) => {
      if (data?.success && data.settings) {
        setTitle(data.settings.site_title || "PLUGS MARKET");
        setSlogan(data.settings.site_slogan || "DEMO TESTING APP");
        setBannerUrl(data.settings.banner_url || null);
      }
    });
  }, []);

  return (
    <div
      className="w-full py-10 px-4 flex flex-col items-center justify-center gap-2 relative overflow-hidden"
      style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
    >
      {bannerUrl && <div className="absolute inset-0 bg-black/50" />}
      {!bannerUrl && <div className="absolute inset-0 bg-secondary" />}
      <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-wider neon-text relative z-10">
        {title}
      </h1>
      <p className="text-muted-foreground text-xs sm:text-sm tracking-widest uppercase relative z-10">
        {slogan}
      </p>
    </div>
  );
};

export default HeroBanner;
