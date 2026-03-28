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

// Simple pixel font for captcha (5x7 per character)
const FONT: Record<string, number[]> = {
  "0": [0x0E,0x11,0x13,0x15,0x19,0x11,0x0E],
  "1": [0x04,0x0C,0x04,0x04,0x04,0x04,0x0E],
  "2": [0x0E,0x11,0x01,0x06,0x08,0x10,0x1F],
  "3": [0x0E,0x11,0x01,0x06,0x01,0x11,0x0E],
  "4": [0x02,0x06,0x0A,0x12,0x1F,0x02,0x02],
  "5": [0x1F,0x10,0x1E,0x01,0x01,0x11,0x0E],
  "6": [0x06,0x08,0x10,0x1E,0x11,0x11,0x0E],
  "7": [0x1F,0x01,0x02,0x04,0x08,0x08,0x08],
  "8": [0x0E,0x11,0x11,0x0E,0x11,0x11,0x0E],
  "9": [0x0E,0x11,0x11,0x0F,0x01,0x02,0x0C],
  "A": [0x0E,0x11,0x11,0x1F,0x11,0x11,0x11],
  "B": [0x1E,0x11,0x11,0x1E,0x11,0x11,0x1E],
  "C": [0x0E,0x11,0x10,0x10,0x10,0x11,0x0E],
  "D": [0x1E,0x11,0x11,0x11,0x11,0x11,0x1E],
  "E": [0x1F,0x10,0x10,0x1E,0x10,0x10,0x1F],
  "F": [0x1F,0x10,0x10,0x1E,0x10,0x10,0x10],
  "G": [0x0E,0x11,0x10,0x17,0x11,0x11,0x0E],
  "H": [0x11,0x11,0x11,0x1F,0x11,0x11,0x11],
  "K": [0x11,0x12,0x14,0x18,0x14,0x12,0x11],
  "L": [0x10,0x10,0x10,0x10,0x10,0x10,0x1F],
  "M": [0x11,0x1B,0x15,0x11,0x11,0x11,0x11],
  "N": [0x11,0x19,0x15,0x13,0x11,0x11,0x11],
  "P": [0x1E,0x11,0x11,0x1E,0x10,0x10,0x10],
  "R": [0x1E,0x11,0x11,0x1E,0x14,0x12,0x11],
  "S": [0x0E,0x11,0x10,0x0E,0x01,0x11,0x0E],
  "T": [0x1F,0x04,0x04,0x04,0x04,0x04,0x04],
  "U": [0x11,0x11,0x11,0x11,0x11,0x11,0x0E],
  "V": [0x11,0x11,0x11,0x11,0x0A,0x0A,0x04],
  "W": [0x11,0x11,0x11,0x15,0x15,0x1B,0x11],
  "X": [0x11,0x11,0x0A,0x04,0x0A,0x11,0x11],
  "Y": [0x11,0x11,0x0A,0x04,0x04,0x04,0x04],
  "Z": [0x1F,0x01,0x02,0x04,0x08,0x10,0x1F],
};

function generateCaptchaCode(): string {
  const chars = "ABCDEFGHKNPRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateCaptchaBMP(code: string): Uint8Array {
  const W = 200;
  const H = 80;
  const scale = 3;
  const charW = 5 * scale;
  const charH = 7 * scale;
  const totalTextW = code.length * (charW + scale);
  const offsetX = Math.floor((W - totalTextW) / 2);
  const offsetY = Math.floor((H - charH) / 2);

  // BMP: 3 bytes per pixel, rows padded to 4 bytes
  const rowSize = Math.ceil(W * 3 / 4) * 4;
  const pixelDataSize = rowSize * H;
  const fileSize = 54 + pixelDataSize;
  const bmp = new Uint8Array(fileSize);

  // BMP Header
  bmp[0] = 0x42; bmp[1] = 0x4D; // "BM"
  bmp[2] = fileSize & 0xFF; bmp[3] = (fileSize >> 8) & 0xFF;
  bmp[4] = (fileSize >> 16) & 0xFF; bmp[5] = (fileSize >> 24) & 0xFF;
  bmp[10] = 54; // pixel data offset
  // DIB Header
  bmp[14] = 40; // DIB header size
  bmp[18] = W & 0xFF; bmp[19] = (W >> 8) & 0xFF;
  bmp[22] = H & 0xFF; bmp[23] = (H >> 8) & 0xFF;
  bmp[26] = 1; // planes
  bmp[28] = 24; // bits per pixel

  // Fill with light background + noise
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = 54 + (H - 1 - y) * rowSize + x * 3;
      const noise = Math.floor(Math.random() * 30);
      bmp[idx] = 220 + noise;     // B
      bmp[idx + 1] = 225 + Math.floor(Math.random() * 20); // G
      bmp[idx + 2] = 230 + Math.floor(Math.random() * 20); // R
    }
  }

  // Add random lines for distortion
  for (let l = 0; l < 5; l++) {
    const y1 = Math.floor(Math.random() * H);
    const y2 = Math.floor(Math.random() * H);
    const r = Math.floor(Math.random() * 100);
    const g = Math.floor(Math.random() * 100);
    const b = Math.floor(Math.random() * 100);
    for (let x = 0; x < W; x++) {
      const y = Math.round(y1 + (y2 - y1) * x / W);
      if (y >= 0 && y < H) {
        const idx = 54 + (H - 1 - y) * rowSize + x * 3;
        bmp[idx] = b; bmp[idx + 1] = g; bmp[idx + 2] = r;
      }
    }
  }

  // Draw text
  for (let ci = 0; ci < code.length; ci++) {
    const ch = code[ci];
    const glyph = FONT[ch];
    if (!glyph) continue;
    const cx = offsetX + ci * (charW + scale);
    const jitterY = Math.floor(Math.random() * 6) - 3;

    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (glyph[row] & (1 << (4 - col))) {
          // Draw scaled pixel
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const px = cx + col * scale + sx;
              const py = offsetY + row * scale + sy + jitterY;
              if (px >= 0 && px < W && py >= 0 && py < H) {
                const idx = 54 + (H - 1 - py) * rowSize + px * 3;
                bmp[idx] = Math.floor(Math.random() * 40);     // B
                bmp[idx + 1] = Math.floor(Math.random() * 40); // G
                bmp[idx + 2] = Math.floor(Math.random() * 40); // R
              }
            }
          }
        }
      }
    }
  }

  // Add random dots
  for (let d = 0; d < 300; d++) {
    const x = Math.floor(Math.random() * W);
    const y = Math.floor(Math.random() * H);
    const idx = 54 + (H - 1 - y) * rowSize + x * 3;
    bmp[idx] = Math.floor(Math.random() * 150);
    bmp[idx + 1] = Math.floor(Math.random() * 150);
    bmp[idx + 2] = Math.floor(Math.random() * 150);
  }

  return bmp;
}

function replaceTemplateTags(text: string, from: any): string {
  return text
    .replace(/\{first_name\}/g, from.first_name || "")
    .replace(/\{last_name\}/g, from.last_name || "")
    .replace(/\{username\}/g, from.username ? `@${from.username}` : from.first_name || "")
    .replace(/\{user_id\}/g, String(from.id || ""))
    .replace(/\{language\}/g, from.language_code || "");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("OK", { status: 200 });
  }

  try {
    const update = await req.json();
    console.log("Webhook received update:", JSON.stringify(update));

    const message = update?.message;
    if (!message?.text && !message?.photo) {
      console.log("No text message, ignoring");
      return new Response("OK", { status: 200 });
    }

    const chatId = message.chat.id;
    const text = message.text || "";
    const from = message.from || {};

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
    const tgBase = `https://api.telegram.org/bot${botToken}`;

    // Track user interaction
    try {
      await supabase.rpc("track_telegram_interaction", {
        p_chat_id: chatId,
        p_username: from.username || null,
        p_first_name: from.first_name || null,
        p_last_name: from.last_name || null,
        p_language_code: from.language_code || null,
      });
    } catch (e) {
      console.error("Track interaction error:", e);
    }

    // Get welcome config (including captcha settings)
    const { data: welcome } = await supabase
      .from("telegram_welcome")
      .select("image_url, message_text, buttons, captcha_enabled, captcha_message")
      .eq("id", 1)
      .maybeSingle();

    const captchaEnabled = welcome?.captcha_enabled || false;

    // Handle /start command
    if (text.startsWith("/start")) {

      if (captchaEnabled) {
        // Delete any existing captcha for this chat
        await supabase.from("telegram_captcha").delete().eq("chat_id", chatId);

        // Generate captcha
        const code = generateCaptchaCode();
        const bmpData = generateCaptchaBMP(code);

        // Store captcha in DB
        await supabase.from("telegram_captcha").insert({
          chat_id: chatId,
          code: code,
        });

        // Send captcha image via multipart form-data
        const boundary = "----CaptchaBoundary" + Date.now();
        const fileName = "captcha.bmp";

        // Build captcha message text - replace {captcha} with the actual code in <code> tags
        let captchaMsg = (welcome?.captcha_message || "Entrez le code : {captcha}")
          .replace(/\{captcha\}/g, `<code>${code}</code>`);
        captchaMsg = replaceTemplateTags(captchaMsg, from);

        // Build multipart body
        const parts: Uint8Array[] = [];
        const enc = new TextEncoder();

        // chat_id field
        parts.push(enc.encode(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${chatId}\r\n`));
        // caption field
        parts.push(enc.encode(`--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${captchaMsg}\r\n`));
        // parse_mode field
        parts.push(enc.encode(`--${boundary}\r\nContent-Disposition: form-data; name="parse_mode"\r\n\r\nHTML\r\n`));
        // photo file
        parts.push(enc.encode(`--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="${fileName}"\r\nContent-Type: image/bmp\r\n\r\n`));
        parts.push(bmpData);
        parts.push(enc.encode(`\r\n--${boundary}--\r\n`));

        // Combine all parts
        const totalLen = parts.reduce((s, p) => s + p.length, 0);
        const bodyBytes = new Uint8Array(totalLen);
        let offset = 0;
        for (const p of parts) {
          bodyBytes.set(p, offset);
          offset += p.length;
        }

        const res = await fetch(`${tgBase}/sendPhoto`, {
          method: "POST",
          headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
          body: bodyBytes,
        });
        const resData = await res.text();
        console.log("sendPhoto captcha response:", res.status, resData);

        return new Response("OK", { status: 200 });
      }

      // No captcha - send welcome directly
      await sendWelcomeMessage(tgBase, chatId, from, welcome);
      return new Response("OK", { status: 200 });
    }

    // Handle captcha verification (non-/start text messages)
    if (captchaEnabled && text.trim()) {
      // Check if there's a pending captcha for this chat
      const { data: pending } = await supabase
        .from("telegram_captcha")
        .select("id, code, expires_at")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pending) {
        // Check expiry
        if (new Date(pending.expires_at) < new Date()) {
          await supabase.from("telegram_captcha").delete().eq("id", pending.id);
          await fetch(`${tgBase}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: "⏰ Code expiré. Envoyez /start pour réessayer.",
              parse_mode: "HTML",
            }),
          });
          return new Response("OK", { status: 200 });
        }

        // Check code (case-insensitive)
        if (text.trim().toUpperCase() === pending.code.toUpperCase()) {
          // Delete captcha
          await supabase.from("telegram_captcha").delete().eq("id", pending.id);

          // Send success then welcome
          await sendWelcomeMessage(tgBase, chatId, from, welcome);
        } else {
          await fetch(`${tgBase}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: "❌ Code incorrect. Réessayez ou envoyez /start pour un nouveau code.",
              parse_mode: "HTML",
            }),
          });
        }
        return new Response("OK", { status: 200 });
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return new Response("OK", { status: 200 });
  }
});

async function sendWelcomeMessage(tgBase: string, chatId: number, from: any, welcome: any) {
  let text = replaceTemplateTags(welcome?.message_text || "Bienvenue ! 👋", from);
  const imageUrl = welcome?.image_url || null;
  const buttons = (welcome?.buttons as Array<{ text: string; url: string; type: string }>) || [];

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

  if (imageUrl) {
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
    console.log("sendPhoto welcome:", res.status, await res.text());
  } else {
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
    console.log("sendMessage welcome:", res.status, await res.text());
  }
}
