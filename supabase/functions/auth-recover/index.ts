import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function hashSHA256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizeSeedPhrase(seedPhrase: string): string {
  return seedPhrase.trim().toLowerCase().split(/\s+/).join(" ");
}

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MINUTES = 15;

async function checkRateLimit(supabase: ReturnType<typeof createClient>, key: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
  await supabase.from("rate_limits").delete().lt("window_start", windowStart);

  const { data, error } = await supabase
    .from("rate_limits")
    .select("id, attempts")
    .eq("key", key)
    .gte("window_start", windowStart)
    .maybeSingle();

  if (error) return false;

  if (!data) {
    await supabase.from("rate_limits").insert({ key, attempts: 1, window_start: new Date().toISOString() });
    return false;
  }

  if (data.attempts >= RATE_LIMIT_MAX) return true;

  await supabase.from("rate_limits").update({ attempts: data.attempts + 1 }).eq("id", data.id);
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const seedPhrase = typeof payload?.seed_phrase === "string" ? payload.seed_phrase : "";
    const newPassword = typeof payload?.new_password === "string" ? payload.new_password : "";
    const newUsernameRaw = typeof payload?.new_username === "string" ? payload.new_username : "";
    const newTelegramId = typeof payload?.new_telegram_id === "number" ? payload.new_telegram_id : undefined;

    if (!seedPhrase || !newPassword) {
      return new Response(
        JSON.stringify({ error: "Phrase de récupération et nouveau mot de passe requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: "Le mot de passe doit contenir au moins 8 caractères" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedUsername = newUsernameRaw.toLowerCase().trim();
    if (normalizedUsername && (normalizedUsername.length < 3 || normalizedUsername.length > 30)) {
      return new Response(
        JSON.stringify({ error: "Le pseudo doit contenir entre 3 et 30 caractères" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Rate limit recovery attempts
    const rateLimitKey = `recover:${await hashSHA256(seedPhrase.substring(0, 20))}`;
    const isLimited = await checkRateLimit(supabase, rateLimitKey);
    if (isLimited) {
      return new Response(
        JSON.stringify({ error: "Trop de tentatives. Réessayez dans 15 minutes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const seedHash = await hashSHA256(normalizeSeedPhrase(seedPhrase));

    const { data: user, error: userError } = await supabase
      .from("app_users")
      .select("id, username")
      .eq("seed_hash", seedHash)
      .maybeSingle();

    if (userError) {
      console.error("Recovery user lookup error:", userError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la vérification de la phrase" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Phrase de récupération invalide" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (normalizedUsername && normalizedUsername !== user.username) {
      const { data: existingUsername, error: usernameCheckError } = await supabase
        .from("app_users")
        .select("id")
        .eq("username", normalizedUsername)
        .maybeSingle();

      if (usernameCheckError) {
        console.error("Recovery username check error:", usernameCheckError);
        return new Response(
          JSON.stringify({ error: "Erreur lors de la vérification du pseudo" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (existingUsername) {
        return new Response(
          JSON.stringify({ error: "Ce pseudo est déjà pris" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Use bcrypt for new password
    const newPasswordHash = await bcrypt.hash(newPassword);

    const updatePayload: {
      password_hash: string;
      username?: string;
      telegram_id?: number;
    } = {
      password_hash: newPasswordHash,
    };

    if (normalizedUsername) {
      updatePayload.username = normalizedUsername;
    }

    if (typeof newTelegramId === "number") {
      updatePayload.telegram_id = newTelegramId;
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from("app_users")
      .update(updatePayload)
      .eq("id", user.id)
      .select("id, username")
      .single();

    if (updateError) {
      console.error("Recovery update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la mise à jour" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Invalidate all existing sessions for this user
    await supabase.from("session_tokens").delete().eq("user_id", user.id);

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: updatedUser.id, username: updatedUser.username },
        message: "Compte mis à jour avec succès",
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
