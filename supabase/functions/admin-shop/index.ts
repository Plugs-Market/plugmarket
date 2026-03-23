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

async function validateAdmin(supabase: ReturnType<typeof createClient>, token: string | null) {
  if (!token) return null;
  const tokenHash = await hashTokenSHA256(token);
  const { data: session } = await supabase
    .from("session_tokens")
    .select("user_id, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (!session || new Date(session.expires_at) < new Date()) return null;
  const { data: user } = await supabase
    .from("app_users")
    .select("id, grade")
    .eq("id", session.user_id)
    .maybeSingle();
  if (!user || user.grade !== "Admin") return null;
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

    const body = await req.json();
    const { action, session_token } = body;

    const admin = await validateAdmin(supabase, session_token || null);
    if (!admin) {
      return new Response(
        JSON.stringify({ error: "Accès refusé" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- CATEGORIES ---
    if (action === "add_category") {
      const { name } = body;
      if (!name?.trim()) return errResponse("Nom requis");
      const { data: maxOrder } = await supabase.from("categories").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
      const { error } = await supabase.from("categories").insert({ name: name.trim(), sort_order: (maxOrder?.sort_order ?? 0) + 1 });
      if (error) {
        if (error.code === "23505") return errResponse("Ce menu existe déjà");
        throw error;
      }
      return okResponse();
    }

    if (action === "rename_category") {
      const { id, name } = body;
      if (!id || !name?.trim()) return errResponse("Paramètres manquants");
      const { error } = await supabase.from("categories").update({ name: name.trim() }).eq("id", id);
      if (error) throw error;
      return okResponse();
    }

    if (action === "delete_category") {
      const { id } = body;
      if (!id) return errResponse("ID manquant");
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      return okResponse();
    }

    // --- SUBCATEGORIES ---
    if (action === "add_subcategory") {
      const { category_id, name } = body;
      if (!category_id || !name?.trim()) return errResponse("Paramètres manquants");
      const { data: maxOrder } = await supabase.from("subcategories").select("sort_order").eq("category_id", category_id).order("sort_order", { ascending: false }).limit(1).maybeSingle();
      const { error } = await supabase.from("subcategories").insert({ category_id, name: name.trim(), sort_order: (maxOrder?.sort_order ?? 0) + 1 });
      if (error) {
        if (error.code === "23505") return errResponse("Cette sous-catégorie existe déjà");
        throw error;
      }
      return okResponse();
    }

    if (action === "delete_subcategory") {
      const { id } = body;
      if (!id) return errResponse("ID manquant");
      const { error } = await supabase.from("subcategories").delete().eq("id", id);
      if (error) throw error;
      return okResponse();
    }

    // --- FARMS ---
    if (action === "add_farm") {
      const { name } = body;
      if (!name?.trim()) return errResponse("Nom requis");
      const { data: maxOrder } = await supabase.from("farms").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
      const { error } = await supabase.from("farms").insert({ name: name.trim(), sort_order: (maxOrder?.sort_order ?? 0) + 1 });
      if (error) {
        if (error.code === "23505") return errResponse("Cette catégorie existe déjà");
        throw error;
      }
      return okResponse();
    }

    if (action === "rename_farm") {
      const { id, name } = body;
      if (!id || !name?.trim()) return errResponse("Paramètres manquants");
      const { error } = await supabase.from("farms").update({ name: name.trim() }).eq("id", id);
      if (error) throw error;
      return okResponse();
    }

    if (action === "delete_farm") {
      const { id } = body;
      if (!id) return errResponse("ID manquant");
      const { error } = await supabase.from("farms").delete().eq("id", id);
      if (error) throw error;
      return okResponse();
    }

    return errResponse("Action inconnue", 400);
  } catch (error) {
    console.error("Admin shop error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function okResponse() {
  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function errResponse(msg: string, status = 400) {
  return new Response(
    JSON.stringify({ error: msg }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
