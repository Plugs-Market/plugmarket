import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const body = await req.json();
    const { action, session_token } = body;

    // Public read
    if (action === "get_settings") {
      const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
      if (error) return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true, settings: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Admin actions
    if (!session_token) {
      return new Response(JSON.stringify({ success: false, error: "Non authentifié" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const user = await verifyAdmin(supabase, session_token);
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: "Accès refusé" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (user.grade === "Demo Admin") {
      return new Response(JSON.stringify({ success: false, error: "Lecture seule" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "update_settings") {
      const { site_title, site_slogan, banner_url } = body;
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (site_title !== undefined) updates.site_title = site_title;
      if (site_slogan !== undefined) updates.site_slogan = site_slogan;
      if (banner_url !== undefined) updates.banner_url = banner_url;

      const { error } = await supabase.from("site_settings").update(updates).eq("id", 1);
      if (error) return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: false, error: "Action inconnue" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
