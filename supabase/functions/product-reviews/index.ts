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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { action, product_id, rating, comment, is_anonymous, session_token } =
      await req.json();

    // GET REVIEWS — public, no auth needed
    if (action === "get_reviews") {
      if (!product_id) return json({ error: "product_id requis" }, 400);

      const { data: reviews, error } = await supabase
        .from("product_reviews")
        .select("id, product_id, user_id, rating, comment, is_anonymous, created_at")
        .eq("product_id", product_id)
        .order("created_at", { ascending: false });

      if (error) return json({ error: error.message }, 500);

      // Fetch usernames for non-anonymous reviews
      const userIds = [...new Set(reviews.filter((r: any) => !r.is_anonymous).map((r: any) => r.user_id))];
      let usernameMap: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from("app_users")
          .select("id, username")
          .in("id", userIds);
        if (users) {
          for (const u of users) {
            usernameMap[u.id] = u.username;
          }
        }
      }

      const formatted = reviews.map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        is_anonymous: r.is_anonymous,
        username: r.is_anonymous ? null : (usernameMap[r.user_id] || "Utilisateur"),
        created_at: r.created_at,
        user_id: r.user_id,
      }));

      return json({ success: true, reviews: formatted });
    }

    // ADD REVIEW — requires auth
    if (action === "add_review") {
      if (!session_token) return json({ error: "Non authentifié" }, 401);

      // Validate session
      const crypto = globalThis.crypto;
      const tokenBytes = new TextEncoder().encode(session_token);
      const hashBuffer = await crypto.subtle.digest("SHA-256", tokenBytes);
      const tokenHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const { data: session } = await supabase
        .from("session_tokens")
        .select("user_id, expires_at")
        .eq("token_hash", tokenHash)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (!session) return json({ error: "Session invalide" }, 401);

      if (!product_id) return json({ error: "product_id requis" }, 400);
      if (!rating || rating < 1 || rating > 5) return json({ error: "Note entre 1 et 5" }, 400);
      if (typeof comment !== "string" || comment.trim().length === 0) return json({ error: "Commentaire requis" }, 400);
      if (comment.trim().length > 1000) return json({ error: "Commentaire trop long (max 1000)" }, 400);

      // Check if user already reviewed this product
      const { data: existing } = await supabase
        .from("product_reviews")
        .select("id")
        .eq("product_id", product_id)
        .eq("user_id", session.user_id)
        .maybeSingle();

      if (existing) return json({ error: "Vous avez déjà laissé un avis sur ce produit" }, 400);

      const { error: insertError } = await supabase
        .from("product_reviews")
        .insert({
          product_id,
          user_id: session.user_id,
          rating: Math.round(rating),
          comment: comment.trim(),
          is_anonymous: !!is_anonymous,
        });

      if (insertError) return json({ error: insertError.message }, 500);

      return json({ success: true });
    }

    // DELETE REVIEW — owner only
    if (action === "delete_review") {
      if (!session_token) return json({ error: "Non authentifié" }, 401);

      const crypto = globalThis.crypto;
      const tokenBytes = new TextEncoder().encode(session_token);
      const hashBuffer = await crypto.subtle.digest("SHA-256", tokenBytes);
      const tokenHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const { data: session } = await supabase
        .from("session_tokens")
        .select("user_id, expires_at")
        .eq("token_hash", tokenHash)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (!session) return json({ error: "Session invalide" }, 401);

      const reviewId = product_id; // reuse field for review id
      if (!reviewId) return json({ error: "review_id requis" }, 400);

      const { error: delError } = await supabase
        .from("product_reviews")
        .delete()
        .eq("id", reviewId)
        .eq("user_id", session.user_id);

      if (delError) return json({ error: delError.message }, 500);

      return json({ success: true });
    }

    return json({ error: "Action inconnue" }, 400);
  } catch (e) {
    return json({ error: "Erreur serveur" }, 500);
  }
});
