import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// AES-GCM decrypt (same as admin-telegram)
async function getKey(): Promise<CryptoKey> {
  const raw = Deno.env.get("AES_ENCRYPTION_KEY")!;
  const keyBytes = new TextEncoder().encode(raw.slice(0, 32).padEnd(32, "0"));
  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["decrypt"]);
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
  // Telegram sends POST with Update object
  if (req.method !== "POST") {
    return new Response("OK", { status: 200 });
  }

  try {
    const update = await req.json();
    console.log("Webhook received update:", JSON.stringify(update));

    // Only handle /start command
    const message = update?.message;
    if (!message?.text || !message.text.startsWith("/start")) {
      console.log("Not a /start command, ignoring");
      return new Response("OK", { status: 200 });
    }

    const chatId = message.chat.id;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get bot token
    const { data: config } = await supabase
      .from("telegram_config")
      .select("bot_token_encrypted")
      .eq("id", 1)
      .maybeSingle();

    if (!config?.bot_token_encrypted) {
      console.log("No bot token found in config");
      return new Response("OK", { status: 200 });
    }

    const botToken = await decrypt(config.bot_token_encrypted);

    // Get welcome message config
    const { data: welcome } = await supabase
      .from("telegram_welcome")
      .select("image_url, message_text, buttons")
      .eq("id", 1)
      .maybeSingle();

    // Replace template tags
    const from = message.from || {};
    let text = (welcome?.message_text || "Bienvenue ! 👋")
      .replace(/\{first_name\}/g, from.first_name || "")
      .replace(/\{last_name\}/g, from.last_name || "")
      .replace(/\{username\}/g, from.username ? `@${from.username}` : from.first_name || "")
      .replace(/\{user_id\}/g, String(from.id || ""))
      .replace(/\{language\}/g, from.language_code || "");
    const imageUrl = welcome?.image_url || null;
    const buttons = (welcome?.buttons as Array<{ text: string; url: string; type: string }>) || [];

    // Build inline keyboard
    let reply_markup: any = undefined;
    if (buttons.length > 0) {
      const keyboard = buttons
        .filter((b) => b.text && b.url)
        .map((b) => {
          if (b.type === "miniapp") {
            return [{ text: b.text, web_app: { url: b.url } }];
          }
          return [{ text: b.text, url: b.url }];
        });

      if (keyboard.length > 0) {
        reply_markup = { inline_keyboard: keyboard };
      }
    }

    const tgBase = `https://api.telegram.org/bot${botToken}`;

    if (imageUrl) {
      // Send photo with caption and buttons
      const body: any = {
        chat_id: chatId,
        photo: imageUrl,
        caption: text,
        parse_mode: "HTML",
      };
      if (reply_markup) body.reply_markup = reply_markup;

      const res = await fetch(`${tgBase}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const resData = await res.text();
      console.log("sendPhoto response:", res.status, resData);
    } else {
      // Send text message with buttons
      const body: any = {
        chat_id: chatId,
        text: text,
        parse_mode: "HTML",
      };
      if (reply_markup) body.reply_markup = reply_markup;

      const res = await fetch(`${tgBase}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const resData = await res.text();
      console.log("sendMessage response:", res.status, resData);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return new Response("OK", { status: 200 });
  }
});
