import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// --- AES-256-GCM Encryption helpers ---
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getAESKey(): Promise<CryptoKey> {
  const keyHex = Deno.env.get("AES_ENCRYPTION_KEY");
  if (!keyHex) throw new Error("AES_ENCRYPTION_KEY not set");
  console.log("AES key length (chars):", keyHex.length, "expected: 64");
  // If key is not valid hex of 64 chars, derive a 32-byte key via SHA-256
  let keyBytes: Uint8Array;
  if (/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    keyBytes = hexToBytes(keyHex);
  } else {
    // Derive 32-byte key from whatever was provided
    const encoded = new TextEncoder().encode(keyHex);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
    keyBytes = new Uint8Array(hashBuffer);
    console.log("Derived AES key via SHA-256 from non-hex input");
  }
  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encryptAES(plaintext: string): Promise<string> {
  const key = await getAESKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  // Format: base64(iv):base64(ciphertext)
  return bytesToBase64(iv) + ":" + bytesToBase64(new Uint8Array(ciphertext));
}

async function decryptAES(encrypted: string): Promise<string> {
  const key = await getAESKey();
  const [ivB64, ctB64] = encrypted.split(":");
  if (!ivB64 || !ctB64) return encrypted; // not encrypted, return as-is
  try {
    const iv = base64ToBytes(ivB64);
    const ciphertext = base64ToBytes(ctB64);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  } catch {
    return encrypted; // decryption failed, return raw
  }
}

// --- Auth helpers ---
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

async function validateSession(supabase: ReturnType<typeof createClient>, token: string | null) {
  if (!token) return null;
  const tokenHash = await hashTokenSHA256(token);
  const { data: session } = await supabase
    .from("session_tokens")
    .select("user_id, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (!session || new Date(session.expires_at) < new Date()) return null;
  return session;
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

    // --- READ (public, requires valid session) ---
    if (action === "get_shop_data") {
      const session = await validateSession(supabase, session_token || null);
      if (!session) {
        return new Response(
          JSON.stringify({ error: "Session invalide" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const [catsRes, subsRes, farmsRes] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("subcategories").select("*").order("sort_order"),
        supabase.from("farms").select("*").order("sort_order"),
      ]);

      // Decrypt all names
      const categories = await Promise.all(
        (catsRes.data || []).map(async (c: any) => ({
          ...c,
          name: await decryptAES(c.name),
        }))
      );

      const subcategories = await Promise.all(
        (subsRes.data || []).map(async (s: any) => ({
          ...s,
          name: await decryptAES(s.name),
        }))
      );

      const farms = await Promise.all(
        (farmsRes.data || []).map(async (f: any) => ({
          ...f,
          name: await decryptAES(f.name),
        }))
      );

      return new Response(
        JSON.stringify({ success: true, categories, subcategories, farms }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- PUBLIC READ (no auth, for storefront) ---
    if (action === "get_public_shop_data") {
      const [catsRes, subsRes, farmsRes] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("subcategories").select("*").order("sort_order"),
        supabase.from("farms").select("*").order("sort_order"),
      ]);

      const categories = await Promise.all(
        (catsRes.data || []).map(async (c: any) => ({
          ...c,
          name: await decryptAES(c.name),
        }))
      );

      const subcategories = await Promise.all(
        (subsRes.data || []).map(async (s: any) => ({
          ...s,
          name: await decryptAES(s.name),
        }))
      );

      const farms = await Promise.all(
        (farmsRes.data || []).map(async (f: any) => ({
          ...f,
          name: await decryptAES(f.name),
        }))
      );

      return new Response(
        JSON.stringify({ success: true, categories, subcategories, farms }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- ADMIN ACTIONS (require admin) ---
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
      const encryptedName = await encryptAES(name.trim());
      const { data: maxOrder } = await supabase.from("categories").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
      const { error } = await supabase.from("categories").insert({ name: encryptedName, sort_order: (maxOrder?.sort_order ?? 0) + 1 });
      if (error) throw error;
      return okResponse();
    }

    if (action === "rename_category") {
      const { id, name } = body;
      if (!id || !name?.trim()) return errResponse("Paramètres manquants");
      const encryptedName = await encryptAES(name.trim());
      const { error } = await supabase.from("categories").update({ name: encryptedName }).eq("id", id);
      if (error) throw error;
      return okResponse();
    }

    if (action === "delete_category") {
      const { id } = body;
      if (!id) return errResponse("ID manquant");
      await supabase.from("subcategories").delete().eq("category_id", id);
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      return okResponse();
    }

    // --- SUBCATEGORIES ---
    if (action === "add_subcategory") {
      const { category_id, name } = body;
      if (!category_id || !name?.trim()) return errResponse("Paramètres manquants");
      const encryptedName = await encryptAES(name.trim());
      const { data: maxOrder } = await supabase.from("subcategories").select("sort_order").eq("category_id", category_id).order("sort_order", { ascending: false }).limit(1).maybeSingle();
      const { error } = await supabase.from("subcategories").insert({ category_id, name: encryptedName, sort_order: (maxOrder?.sort_order ?? 0) + 1 });
      if (error) throw error;
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
      const encryptedName = await encryptAES(name.trim());
      const { data: maxOrder } = await supabase.from("farms").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
      const { error } = await supabase.from("farms").insert({ name: encryptedName, sort_order: (maxOrder?.sort_order ?? 0) + 1 });
      if (error) throw error;
      return okResponse();
    }

    if (action === "rename_farm") {
      const { id, name } = body;
      if (!id || !name?.trim()) return errResponse("Paramètres manquants");
      const encryptedName = await encryptAES(name.trim());
      const { error } = await supabase.from("farms").update({ name: encryptedName }).eq("id", id);
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
