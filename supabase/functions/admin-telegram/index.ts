import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function hashTokenSHA256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
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

// Simple AES-GCM encrypt/decrypt for bot token storage
async function getKey(): Promise<CryptoKey> {
  const raw = Deno.env.get("AES_ENCRYPTION_KEY")!;
  const keyBytes = new TextEncoder().encode(raw.slice(0, 32).padEnd(32, "0"));
  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encrypt(text: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const combined = new Uint8Array(iv.length + new Uint8Array(cipher).length);
  combined.set(iv);
  combined.set(new Uint8Array(cipher), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decrypt(b64: string): Promise<string> {
  const key = await getKey();
  const combined = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(plain);
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

    const { action, session_token, bot_token } = await req.json();

    const admin = await validateAdmin(supabase, session_token || null);
    if (!admin) {
      return new Response(
        JSON.stringify({ error: "Accès refusé" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_config") {
      const { data: config } = await supabase
        .from("telegram_config")
        .select("bot_username, bot_name, is_connected, bot_token_encrypted")
        .eq("id", 1)
        .maybeSingle();

      const result: any = {
        bot_username: config?.bot_username || "",
        bot_name: config?.bot_name || "",
        is_connected: config?.is_connected || false,
        bot_token_masked: "",
      };

      if (config?.bot_token_encrypted) {
        try {
          const token = await decrypt(config.bot_token_encrypted);
          result.bot_token_masked = "•".repeat(20) + token.slice(-4);
        } catch {
          result.bot_token_masked = "•••• (erreur déchiffrement)";
        }
      }

      return new Response(
        JSON.stringify({ success: true, config: result }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "save_token") {
      if (!bot_token) {
        return new Response(
          JSON.stringify({ error: "Token manquant" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate token with Telegram API
      const tgRes = await fetch(`https://api.telegram.org/bot${bot_token}/getMe`);
      const tgData = await tgRes.json();

      if (!tgRes.ok || !tgData.ok) {
        return new Response(
          JSON.stringify({ error: "Token invalide — vérifiez avec @BotFather" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const encrypted = await encrypt(bot_token);

      const { error } = await supabase
        .from("telegram_config")
        .update({
          bot_token_encrypted: encrypted,
          bot_username: tgData.result.username,
          bot_name: tgData.result.first_name,
          is_connected: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          bot_info: {
            username: tgData.result.username,
            first_name: tgData.result.first_name,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "test_bot") {
      const { data: config } = await supabase
        .from("telegram_config")
        .select("bot_token_encrypted")
        .eq("id", 1)
        .maybeSingle();

      if (!config?.bot_token_encrypted) {
        return new Response(
          JSON.stringify({ error: "Aucun bot configuré" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const token = await decrypt(config.bot_token_encrypted);
      const tgRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const tgData = await tgRes.json();

      if (!tgRes.ok || !tgData.ok) {
        return new Response(
          JSON.stringify({ error: "Le bot ne répond pas" }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, bot: tgData.result }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_welcome") {
      const { data: welcome } = await supabase
        .from("telegram_welcome")
        .select("image_url, message_text, buttons")
        .eq("id", 1)
        .maybeSingle();

      return new Response(
        JSON.stringify({ success: true, welcome: welcome || { image_url: null, message_text: "Bienvenue ! 👋", buttons: [] } }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "save_welcome") {
      const { image_url, message_text, buttons } = await req.json().catch(() => ({}));
      const body = JSON.parse(await new Response(req.body).text().catch(() => "{}"));
      
      const { error } = await supabase
        .from("telegram_welcome")
        .update({
          image_url: image_url ?? null,
          message_text: message_text || "Bienvenue ! 👋",
          buttons: buttons || [],
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "disconnect") {
      const { error } = await supabase
        .from("telegram_config")
        .update({
          bot_token_encrypted: null,
          bot_username: null,
          bot_name: null,
          is_connected: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

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
    console.error("Admin Telegram error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
