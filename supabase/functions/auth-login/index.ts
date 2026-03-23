import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";

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

function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MINUTES = 15;

async function checkRateLimit(supabase: ReturnType<typeof createClient>, key: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();

  // Clean old entries
  await supabase.from("rate_limits").delete().lt("window_start", windowStart);

  const { data, error } = await supabase
    .from("rate_limits")
    .select("id, attempts")
    .eq("key", key)
    .gte("window_start", windowStart)
    .maybeSingle();

  if (error) {
    console.error("Rate limit check error:", error);
    return false; // allow on error
  }

  if (!data) {
    await supabase.from("rate_limits").insert({ key, attempts: 1, window_start: new Date().toISOString() });
    return false;
  }

  if (data.attempts >= RATE_LIMIT_MAX) {
    return true; // rate limited
  }

  await supabase.from("rate_limits").update({ attempts: data.attempts + 1 }).eq("id", data.id);
  return false;
}

async function resetRateLimit(supabase: ReturnType<typeof createClient>, key: string) {
  await supabase.from("rate_limits").delete().eq("key", key);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: "Pseudo et mot de passe requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const rateLimitKey = `login:${username.toLowerCase().trim()}`;
    const isLimited = await checkRateLimit(supabase, rateLimitKey);
    if (isLimited) {
      return new Response(
        JSON.stringify({ error: "Trop de tentatives. Réessayez dans 15 minutes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: user, error } = await supabase
      .from("app_users")
      .select("id, username, grade, password_hash")
      .eq("username", username.toLowerCase().trim())
      .maybeSingle();

    if (error || !user) {
      return new Response(
        JSON.stringify({ error: "Pseudo ou mot de passe incorrect" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Support both bcrypt and legacy SHA-256 hashes
    let passwordValid = false;
    console.log("Login attempt for:", user.username, "hash prefix:", user.password_hash.substring(0, 7), "hash length:", user.password_hash.length, "password length:", password.length);
    if (user.password_hash.startsWith("$2")) {
      // bcrypt hash
      try {
        passwordValid = bcrypt.compareSync(password, user.password_hash);
        console.log("bcrypt compareSync result:", passwordValid);
      } catch (e) {
        console.error("bcrypt compareSync error:", e);
      }
    } else {
      // Legacy SHA-256 — verify then migrate to bcrypt
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const sha256Hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      if (sha256Hash === user.password_hash) {
        passwordValid = true;
        // Migrate to bcrypt
        const bcryptHash = bcrypt.hashSync(password, 10);
        await supabase.from("app_users").update({ password_hash: bcryptHash }).eq("id", user.id);
      }
    }

    if (!passwordValid) {
      return new Response(
        JSON.stringify({ error: "Pseudo ou mot de passe incorrect" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Reset rate limit on success
    await resetRateLimit(supabase, rateLimitKey);

    // Generate and persist session token
    const sessionToken = generateSessionToken();
    const tokenHash = await hashTokenSHA256(sessionToken);

    await supabase.from("session_tokens").insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: user.id, username: user.username, grade: user.grade },
        session_token: sessionToken,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Login error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
