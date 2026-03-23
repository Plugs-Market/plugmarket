import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function hashValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { seed_phrase, new_password } = await req.json();

    if (!seed_phrase || !new_password) {
      return new Response(
        JSON.stringify({ error: "Phrase de récupération et nouveau mot de passe requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new_password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Le mot de passe doit contenir au moins 8 caractères" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const seedHash = await hashValue(seed_phrase.trim().toLowerCase());

    const { data: user } = await supabase
      .from("app_users")
      .select("id, username")
      .eq("seed_hash", seedHash)
      .maybeSingle();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Phrase de récupération invalide" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newPasswordHash = await hashValue(new_password);

    const { error: updateError } = await supabase
      .from("app_users")
      .update({ password_hash: newPasswordHash })
      .eq("id", user.id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Erreur lors de la mise à jour" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: user.id, username: user.username },
        message: "Mot de passe mis à jour avec succès",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Recovery error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
