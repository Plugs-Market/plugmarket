import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

let _cachedKey: CryptoKey | null = null;
async function getAESKey(): Promise<CryptoKey> {
  if (_cachedKey) return _cachedKey;
  const keyHex = Deno.env.get("AES_ENCRYPTION_KEY");
  if (!keyHex) throw new Error("AES_ENCRYPTION_KEY not set");
  let keyBytes: Uint8Array;
  if (/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    keyBytes = hexToBytes(keyHex);
  } else {
    const encoded = new TextEncoder().encode(keyHex);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
    keyBytes = new Uint8Array(hashBuffer);
  }
  _cachedKey = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt", "decrypt"]);
  return _cachedKey;
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

      // Pre-warm the AES key
      await getAESKey();

      const [catsRes, subsRes, farmsRes, prodsRes, pcRes, psRes, pvRes] = await Promise.all([
        supabase.from("categories").select("id,name,sort_order").order("sort_order"),
        supabase.from("subcategories").select("id,category_id,name,sort_order").order("sort_order"),
        supabase.from("farms").select("id,name,sort_order").order("sort_order"),
        supabase.from("products").select("id,name,description,price,image_url,sort_order").order("sort_order"),
        supabase.from("product_categories").select("product_id,category_id"),
        supabase.from("product_subcategories").select("product_id,subcategory_id"),
        supabase.from("product_variants").select("id,product_id,label,price,sort_order").order("sort_order"),
      ]);

      const pcMap = new Map<string, string[]>();
      for (const pc of pcRes.data || []) {
        const arr = pcMap.get(pc.product_id) || [];
        arr.push(pc.category_id);
        pcMap.set(pc.product_id, arr);
      }
      const psMap = new Map<string, string[]>();
      for (const ps of psRes.data || []) {
        const arr = psMap.get(ps.product_id) || [];
        arr.push(ps.subcategory_id);
        psMap.set(ps.product_id, arr);
      }
      const pvMap = new Map<string, any[]>();
      for (const pv of pvRes.data || []) {
        const arr = pvMap.get(pv.product_id) || [];
        arr.push({ id: pv.id, label: pv.label, price: Number(pv.price), sort_order: pv.sort_order });
        pvMap.set(pv.product_id, arr);
      }

      const [categories, subcategories, farms, products] = await Promise.all([
        Promise.all((catsRes.data || []).map(async (c: any) => ({ ...c, name: await decryptAES(c.name) }))),
        Promise.all((subsRes.data || []).map(async (s: any) => ({ ...s, name: await decryptAES(s.name) }))),
        Promise.all((farmsRes.data || []).map(async (f: any) => ({ ...f, name: await decryptAES(f.name) }))),
        Promise.all((prodsRes.data || []).map(async (p: any) => ({
          ...p,
          name: await decryptAES(p.name),
          description: p.description ? await decryptAES(p.description) : null,
          category_ids: pcMap.get(p.id) || [],
          subcategory_ids: psMap.get(p.id) || [],
          variants: pvMap.get(p.id) || [],
        }))),
      ]);

      return new Response(
        JSON.stringify({ success: true, categories, subcategories, farms, products }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- PUBLIC READ (no auth, for storefront) ---
    if (action === "get_public_shop_data") {
      // Pre-warm the AES key before parallel decryption
      await getAESKey();

      const [catsRes, subsRes, farmsRes, prodsRes, pcRes, psRes, pvRes] = await Promise.all([
        supabase.from("categories").select("id,name,sort_order").order("sort_order"),
        supabase.from("subcategories").select("id,category_id,name,sort_order").order("sort_order"),
        supabase.from("farms").select("id,name,sort_order").order("sort_order"),
        supabase.from("products").select("id,name,description,price,image_url,sort_order").order("sort_order"),
        supabase.from("product_categories").select("product_id,category_id"),
        supabase.from("product_subcategories").select("product_id,subcategory_id"),
        supabase.from("product_variants").select("id,product_id,label,price,sort_order").order("sort_order"),
      ]);

      const pcMap = new Map<string, string[]>();
      for (const pc of pcRes.data || []) {
        const arr = pcMap.get(pc.product_id) || [];
        arr.push(pc.category_id);
        pcMap.set(pc.product_id, arr);
      }
      const psMap = new Map<string, string[]>();
      for (const ps of psRes.data || []) {
        const arr = psMap.get(ps.product_id) || [];
        arr.push(ps.subcategory_id);
        psMap.set(ps.product_id, arr);
      }
      const pvMap = new Map<string, any[]>();
      for (const pv of pvRes.data || []) {
        const arr = pvMap.get(pv.product_id) || [];
        arr.push({ id: pv.id, label: pv.label, price: Number(pv.price), sort_order: pv.sort_order });
        pvMap.set(pv.product_id, arr);
      }

      const [categories, subcategories, farms, products] = await Promise.all([
        Promise.all((catsRes.data || []).map(async (c: any) => ({ ...c, name: await decryptAES(c.name) }))),
        Promise.all((subsRes.data || []).map(async (s: any) => ({ ...s, name: await decryptAES(s.name) }))),
        Promise.all((farmsRes.data || []).map(async (f: any) => ({ ...f, name: await decryptAES(f.name) }))),
        Promise.all((prodsRes.data || []).map(async (p: any) => ({
          ...p,
          name: await decryptAES(p.name),
          description: p.description ? await decryptAES(p.description) : null,
          category_ids: pcMap.get(p.id) || [],
          subcategory_ids: psMap.get(p.id) || [],
          variants: pvMap.get(p.id) || [],
        }))),
      ]);

      return new Response(
        JSON.stringify({ success: true, categories, subcategories, farms, products }),
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

    // --- PRODUCTS ---
    if (action === "add_product") {
      const { name, description, price, image_url, category_ids, subcategory_ids, variants } = body;
      if (!name?.trim()) return errResponse("Nom requis");
      const encName = await encryptAES(name.trim());
      const encDesc = description?.trim() ? await encryptAES(description.trim()) : null;
      const { data: maxOrder } = await supabase.from("products").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
      const { data: newProduct, error } = await supabase.from("products").insert({
        name: encName,
        description: encDesc,
        price: price || 0,
        image_url: image_url || null,
        sort_order: (maxOrder?.sort_order ?? 0) + 1,
      }).select("id").single();
      if (error) throw error;

      const pid = newProduct.id;
      if (category_ids?.length) {
        await supabase.from("product_categories").insert(
          category_ids.map((cid: string) => ({ product_id: pid, category_id: cid }))
        );
      }
      if (subcategory_ids?.length) {
        await supabase.from("product_subcategories").insert(
          subcategory_ids.map((sid: string) => ({ product_id: pid, subcategory_id: sid }))
        );
      }
      // Insert variants
      if (variants?.length) {
        await supabase.from("product_variants").insert(
          variants.map((v: any, i: number) => ({ product_id: pid, label: v.label, price: v.price || 0, sort_order: i }))
        );
      }
      return okResponse();
    }

    if (action === "update_product") {
      const { id, name, description, price, image_url, category_ids, subcategory_ids, variants } = body;
      if (!id) return errResponse("ID manquant");
      const updates: Record<string, unknown> = {};
      if (name?.trim()) updates.name = await encryptAES(name.trim());
      if (description !== undefined) updates.description = description?.trim() ? await encryptAES(description.trim()) : null;
      if (price !== undefined) updates.price = price;
      if (image_url !== undefined) updates.image_url = image_url;
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from("products").update(updates).eq("id", id);
        if (error) throw error;
      }

      if (category_ids !== undefined) {
        await supabase.from("product_categories").delete().eq("product_id", id);
        if (category_ids?.length) {
          await supabase.from("product_categories").insert(
            category_ids.map((cid: string) => ({ product_id: id, category_id: cid }))
          );
        }
      }
      if (subcategory_ids !== undefined) {
        await supabase.from("product_subcategories").delete().eq("product_id", id);
        if (subcategory_ids?.length) {
          await supabase.from("product_subcategories").insert(
            subcategory_ids.map((sid: string) => ({ product_id: id, subcategory_id: sid }))
          );
        }
      }
      // Replace variants
      if (variants !== undefined) {
        await supabase.from("product_variants").delete().eq("product_id", id);
        if (variants?.length) {
          await supabase.from("product_variants").insert(
            variants.map((v: any, i: number) => ({ product_id: id, label: v.label, price: v.price || 0, sort_order: i }))
          );
        }
      }
      return okResponse();
    }

    if (action === "delete_product") {
      const { id } = body;
      if (!id) return errResponse("ID manquant");
      const { data: product } = await supabase.from("products").select("image_url").eq("id", id).maybeSingle();
      if (product?.image_url) {
        const path = product.image_url.split("/product-images/")[1];
        if (path) await supabase.storage.from("product-images").remove([path]);
      }
      // Junction rows deleted via CASCADE
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      return okResponse();
    }

    if (action === "upload_product_image") {
      const { image_base64, file_name, content_type } = body;
      if (!image_base64 || !file_name) return errResponse("Image requise");
      const binary = atob(image_base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const path = `${crypto.randomUUID()}-${file_name}`;
      const { error } = await supabase.storage.from("product-images").upload(path, bytes, { contentType: content_type || "image/jpeg" });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      return new Response(
        JSON.stringify({ success: true, url: urlData.publicUrl }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
