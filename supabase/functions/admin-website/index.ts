import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function verifyAdmin(supabase: any, sessionToken: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(sessionToken);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const tokenHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

  const { data: session } = await supabase
    .from("session_tokens")
    .select("user_id, expires_at")
    .eq("token_hash", tokenHash)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!session) return null;

  const { data: user } = await supabase
    .from("app_users")
    .select("id, username, grade")
    .eq("id", session.user_id)
    .maybeSingle();

  if (!user || (user.grade !== "Admin" && user.grade !== "Demo Admin")) return null;
  return user;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const contentType = req.headers.get("content-type") || "";

    // Handle multipart form upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const action = formData.get("action") as string;
      const sessionToken = formData.get("session_token") as string;

      if (action !== "upload_banner") return json({ success: false, error: "Action inconnue" }, 400);
      if (!sessionToken) return json({ success: false, error: "Non authentifié" }, 401);

      const user = await verifyAdmin(supabase, sessionToken);
      if (!user) return json({ success: false, error: "Accès refusé" }, 403);
      if (user.grade === "Demo Admin") return json({ success: false, error: "Lecture seule" }, 403);

      const file = formData.get("file") as File | null;
      if (!file) return json({ success: false, error: "Fichier requis" }, 400);

      // Validate file type
      const allowed = ["image/jpeg", "image/png", "image/webp"];
      if (!allowed.includes(file.type)) return json({ success: false, error: "Format non supporté (JPG, PNG, WebP)" }, 400);
      if (file.size > 5 * 1024 * 1024) return json({ success: false, error: "Fichier trop volumineux (max 5 Mo)" }, 400);

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `banner_${Date.now()}.${ext}`;

      // Delete old banner files
      const { data: oldFiles } = await supabase.storage.from("site-banners").list();
      if (oldFiles && oldFiles.length > 0) {
        await supabase.storage.from("site-banners").remove(oldFiles.map((f: any) => f.name));
      }

      // Upload new file
      const arrayBuffer = await file.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from("site-banners")
        .upload(fileName, arrayBuffer, { contentType: file.type, upsert: true });

      if (uploadError) return json({ success: false, error: uploadError.message }, 500);

      const { data: urlData } = supabase.storage.from("site-banners").getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      // Update site_settings
      await supabase.from("site_settings").update({ banner_url: publicUrl, updated_at: new Date().toISOString() }).eq("id", 1);

      return json({ success: true, banner_url: publicUrl });
    }

    // JSON body actions
    const body = await req.json();
    const { action, session_token } = body;

    if (action === "get_settings") {
      const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
      if (error) return json({ success: false, error: error.message }, 500);
      return json({ success: true, settings: data });
    }

    if (!session_token) return json({ success: false, error: "Non authentifié" }, 401);

    const user = await verifyAdmin(supabase, session_token);
    if (!user) return json({ success: false, error: "Accès refusé" }, 403);
    if (user.grade === "Demo Admin") return json({ success: false, error: "Lecture seule" }, 403);

    if (action === "update_settings") {
      const { site_title, site_slogan, banner_url } = body;
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (site_title !== undefined) updates.site_title = site_title;
      if (site_slogan !== undefined) updates.site_slogan = site_slogan;
      if (banner_url !== undefined) updates.banner_url = banner_url;

      const { error } = await supabase.from("site_settings").update(updates).eq("id", 1);
      if (error) return json({ success: false, error: error.message }, 500);
      return json({ success: true });
    }

    if (action === "remove_banner") {
      // Delete all files in bucket
      const { data: files } = await supabase.storage.from("site-banners").list();
      if (files && files.length > 0) {
        await supabase.storage.from("site-banners").remove(files.map((f: any) => f.name));
      }
      await supabase.from("site_settings").update({ banner_url: null, updated_at: new Date().toISOString() }).eq("id", 1);
      return json({ success: true });
    }

    return json({ success: false, error: "Action inconnue" }, 400);
  } catch (e) {
    return json({ success: false, error: e.message }, 500);
  }
});
