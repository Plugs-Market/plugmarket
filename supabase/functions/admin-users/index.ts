import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function hashTokenSHA256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function validateSession(supabase: ReturnType<typeof createClient>, token: string | null): Promise<{ id: string; grade: string } | null> {
  if (!token) return null;

  const tokenHash = await hashTokenSHA256(token);

  const { data: session, error } = await supabase
    .from("session_tokens")
    .select("user_id, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !session) return null;

  // Check expiry
  if (new Date(session.expires_at) < new Date()) {
    await supabase.from("session_tokens").delete().eq("token_hash", tokenHash);
    return null;
  }

  const { data: user, error: userError } = await supabase
    .from("app_users")
    .select("id, grade")
    .eq("id", session.user_id)
    .maybeSingle();

  if (userError || !user) return null;
  return user;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, target_user_id, new_grade, session_token } = await req.json();

    const admin = await validateSession(supabase, session_token || null);

    if (!admin || admin.grade !== "Admin") {
      return new Response(
        JSON.stringify({ error: "Accès refusé" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_stats") {
      const { count: totalUsers } = await supabase.from("app_users").select("*", { count: "exact", head: true });
      const { count: admins } = await supabase.from("app_users").select("*", { count: "exact", head: true }).eq("grade", "Admin");
      const { count: vips } = await supabase.from("app_users").select("*", { count: "exact", head: true }).eq("grade", "VIP");
      const { count: moderators } = await supabase.from("app_users").select("*", { count: "exact", head: true }).eq("grade", "Moderateur");
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { count: recentSignups } = await supabase.from("app_users").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo);
      const { count: telegramLinked } = await supabase.from("app_users").select("*", { count: "exact", head: true }).not("telegram_id", "is", null);

      const stats = {
        totalUsers: totalUsers || 0,
        admins: admins || 0,
        vips: vips || 0,
        moderators: moderators || 0,
        members: (totalUsers || 0) - (admins || 0) - (vips || 0) - (moderators || 0),
        recentSignups: recentSignups || 0,
        telegramLinked: telegramLinked || 0,
      };

      return new Response(
        JSON.stringify({ success: true, stats }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "list_users") {
      const { data: users, error } = await supabase
        .from("app_users")
        .select("id, username, grade, telegram_id, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, users }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "update_grade") {
      if (!target_user_id || !new_grade) {
        return new Response(
          JSON.stringify({ error: "Paramètres manquants" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabase
        .from("app_users")
        .update({ grade: new_grade })
        .eq("id", target_user_id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete_user") {
      if (!target_user_id) {
        return new Response(
          JSON.stringify({ error: "Paramètres manquants" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabase
        .from("app_users")
        .delete()
        .eq("id", target_user_id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Action inconnue" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Admin error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
