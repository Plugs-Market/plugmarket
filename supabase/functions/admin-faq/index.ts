import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function hashTokenSHA256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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
  if (!user || (user.grade !== "Admin" && user.grade !== "Demo Admin")) return null;
  return user;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();
    const { action, session_token } = body;

    // PUBLIC: get all FAQ items
    if (action === "get_faq") {
      const { data, error } = await supabase
        .from("faq_items")
        .select("id, question, answer, sort_order")
        .order("sort_order");
      if (error) return json({ error: error.message }, 500);
      return json({ success: true, items: data });
    }

    // ADMIN actions
    const admin = await validateAdmin(supabase, session_token || null);
    if (!admin) return json({ error: "Accès refusé" }, 403);

    // Demo Admin = read only
    if (admin.grade === "Demo Admin") {
      return json({ error: "Accès en lecture seule" }, 403);
    }

    if (action === "add_faq") {
      const { question, answer } = body;
      if (!question?.trim() || !answer?.trim()) return json({ error: "Question et réponse requises" }, 400);
      const { data: maxOrder } = await supabase
        .from("faq_items")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      const { error } = await supabase.from("faq_items").insert({
        question: question.trim(),
        answer: answer.trim(),
        sort_order: (maxOrder?.sort_order ?? -1) + 1,
      });
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    if (action === "update_faq") {
      const { id, question, answer } = body;
      if (!id) return json({ error: "ID manquant" }, 400);
      const updates: Record<string, unknown> = {};
      if (question?.trim()) updates.question = question.trim();
      if (answer?.trim()) updates.answer = answer.trim();
      if (Object.keys(updates).length === 0) return json({ error: "Rien à modifier" }, 400);
      const { error } = await supabase.from("faq_items").update(updates).eq("id", id);
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    if (action === "delete_faq") {
      const { id } = body;
      if (!id) return json({ error: "ID manquant" }, 400);
      const { error } = await supabase.from("faq_items").delete().eq("id", id);
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    if (action === "reorder_faq") {
      const { items } = body;
      if (!Array.isArray(items)) return json({ error: "Items requis" }, 400);
      for (let i = 0; i < items.length; i++) {
        await supabase.from("faq_items").update({ sort_order: i }).eq("id", items[i]);
      }
      return json({ success: true });
    }

    return json({ error: "Action inconnue" }, 400);
  } catch (e) {
    return json({ error: "Erreur serveur" }, 500);
  }
});
