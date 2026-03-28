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

    const contentType = req.headers.get("content-type") || "";
    let body: any;
    
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = {
        action: formData.get("action") as string,
        session_token: formData.get("session_token") as string,
        message_text: formData.get("message_text") as string,
        buttons: formData.get("buttons") ? JSON.parse(formData.get("buttons") as string) : undefined,
        image_file: formData.get("image_file") as File | null,
        remove_image: formData.get("remove_image") === "true",
        captcha_enabled: formData.get("captcha_enabled") as string | null,
        captcha_message: formData.get("captcha_message") as string | null,
      };
    } else {
      body = await req.json();
    }

    const { action, session_token, bot_token, image_url, message_text, buttons } = body;

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

      // Set webhook URL
      const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/telegram-webhook`;
      await fetch(`https://api.telegram.org/bot${bot_token}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl, allowed_updates: ["message"] }),
      });

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
        .select("image_url, message_text, buttons, captcha_enabled, captcha_message")
        .eq("id", 1)
        .maybeSingle();

      return new Response(
        JSON.stringify({ success: true, welcome: welcome || { image_url: null, message_text: "Bienvenue ! 👋", buttons: [], captcha_enabled: false, captcha_message: "Entrez le code : {captcha}" } }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "save_welcome") {
      let finalImageUrl = image_url ?? null;

      // Handle file upload
      if (body.image_file && body.image_file instanceof File) {
        const file = body.image_file as File;
        const ext = file.name.split(".").pop() || "jpg";
        const fileName = `welcome_${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("telegram-images")
          .upload(fileName, file, { contentType: file.type, upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from("telegram-images")
          .getPublicUrl(fileName);

        finalImageUrl = publicUrl.publicUrl;
      }

      // Handle image removal
      if (body.remove_image) {
        finalImageUrl = null;
      }

      const updateData: any = {
        image_url: finalImageUrl,
        message_text: message_text || "Bienvenue ! 👋",
        buttons: buttons || [],
        updated_at: new Date().toISOString(),
      };
      if (body.captcha_enabled !== undefined) {
        updateData.captcha_enabled = body.captcha_enabled === true || body.captcha_enabled === "true";
      }
      if (body.captcha_message !== undefined) {
        updateData.captcha_message = body.captcha_message || "Entrez le code : {captcha}";
      }

      const { error } = await supabase
        .from("telegram_welcome")
        .update(updateData)
        .eq("id", 1);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, image_url: finalImageUrl }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "disconnect") {
      // Remove webhook first
      const { data: cfg } = await supabase
        .from("telegram_config")
        .select("bot_token_encrypted")
        .eq("id", 1)
        .maybeSingle();

      if (cfg?.bot_token_encrypted) {
        try {
          const tk = await decrypt(cfg.bot_token_encrypted);
          await fetch(`https://api.telegram.org/bot${tk}/deleteWebhook`);
        } catch { /* ignore */ }
      }

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

    if (action === "list_telegram_users") {
      const { data: users, error } = await supabase
        .from("telegram_interactions")
        .select("*")
        .order("last_seen_at", { ascending: false });

      if (error) throw error;

      // Decrypt PII fields
      const decryptedUsers = await Promise.all(
        (users || []).map(async (u: any) => {
          try {
            return {
              ...u,
              username: u.username ? await decrypt(u.username) : null,
              first_name: u.first_name ? await decrypt(u.first_name) : null,
              last_name: u.last_name ? await decrypt(u.last_name) : null,
              language_code: u.language_code ? await decrypt(u.language_code) : null,
            };
          } catch {
            // Fallback for legacy unencrypted data
            return u;
          }
        })
      );

      return new Response(
        JSON.stringify({ success: true, users: decryptedUsers }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "ban_telegram_user") {
      const { chat_id, reason, duration_hours } = body;
      if (!chat_id) {
        return new Response(
          JSON.stringify({ error: "chat_id manquant" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const banUntil = duration_hours ? new Date(Date.now() + duration_hours * 3600000).toISOString() : null;

      const { error } = await supabase
        .from("telegram_interactions")
        .update({
          is_banned: true,
          ban_reason: reason || null,
          ban_until: banUntil,
          banned_at: new Date().toISOString(),
        })
        .eq("chat_id", chat_id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "unban_telegram_user") {
      const { chat_id } = body;
      if (!chat_id) {
        return new Response(
          JSON.stringify({ error: "chat_id manquant" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabase
        .from("telegram_interactions")
        .update({ is_banned: false, ban_reason: null, ban_until: null, banned_at: null })
        .eq("chat_id", chat_id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "check_webhook") {
      const { data: cfg } = await supabase
        .from("telegram_config")
        .select("bot_token_encrypted")
        .eq("id", 1)
        .maybeSingle();

      if (!cfg?.bot_token_encrypted) {
        return new Response(
          JSON.stringify({ error: "Aucun bot configuré" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tk = await decrypt(cfg.bot_token_encrypted);
      
      // Get current webhook info
      const infoRes = await fetch(`https://api.telegram.org/bot${tk}/getWebhookInfo`);
      const infoData = await infoRes.json();

      // Re-set webhook
      const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/telegram-webhook`;
      const setRes = await fetch(`https://api.telegram.org/bot${tk}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl, allowed_updates: ["message"] }),
      });
      const setData = await setRes.json();

      return new Response(
        JSON.stringify({ success: true, webhook_info: infoData, set_result: setData, webhook_url: webhookUrl }),
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
