import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, User, EyeOff, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ReviewWithProduct {
  id: string;
  rating: number;
  comment: string;
  is_anonymous: boolean;
  username: string | null;
  created_at: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={12}
          className={`${value >= star ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days}j`;
  const months = Math.floor(days / 30);
  return `il y a ${months} mois`;
}

export default function AllReviews() {
  const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllReviews = async () => {
      try {
        // Fetch reviews
        const { data: reviewsData } = await supabase
          .from("product_reviews")
          .select("id, product_id, user_id, rating, comment, is_anonymous, created_at")
          .order("created_at", { ascending: false })
          .limit(50);

        if (!reviewsData || reviewsData.length === 0) {
          setReviews([]);
          setLoading(false);
          return;
        }

        // Fetch product names
        const productIds = [...new Set(reviewsData.map((r) => r.product_id))];
        const { data: productsData } = await supabase
          .from("products")
          .select("id, name, image_url")
          .in("id", productIds);

        const productMap: Record<string, { name: string; image_url: string | null }> = {};
        productsData?.forEach((p) => {
          productMap[p.id] = { name: p.name, image_url: p.image_url };
        });

        // Fetch usernames for non-anonymous
        const userIds = [...new Set(reviewsData.filter((r) => !r.is_anonymous).map((r) => r.user_id))];
        let usernameMap: Record<string, string> = {};

        if (userIds.length > 0) {
          const { data, error } = await supabase.functions.invoke("product-reviews", {
            body: { action: "get_reviews", product_id: productIds[0] },
          });
          // We'll use the edge function per product to get usernames — but that's inefficient.
          // Instead, let's just show user_id based info from the reviews themselves.
          // We'll call the edge function for all unique products to gather usernames.
        }

        // Fetch usernames via edge function for each unique product
        const allUsernames: Record<string, string> = {};
        for (const pid of productIds) {
          try {
            const { data } = await supabase.functions.invoke("product-reviews", {
              body: { action: "get_reviews", product_id: pid },
            });
            if (data?.reviews) {
              data.reviews.forEach((r: any) => {
                if (!r.is_anonymous && r.username) {
                  allUsernames[r.user_id] = r.username;
                }
              });
            }
          } catch {}
        }

        const formatted: ReviewWithProduct[] = reviewsData.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment ?? "",
          is_anonymous: r.is_anonymous ?? false,
          username: r.is_anonymous ? null : (allUsernames[r.user_id] || "Utilisateur"),
          created_at: r.created_at,
          product_id: r.product_id,
          product_name: productMap[r.product_id]?.name || "Produit",
          product_image: productMap[r.product_id]?.image_url || null,
        }));

        setReviews(formatted);
      } catch {
      } finally {
        setLoading(false);
      }
    };

    fetchAllReviews();
  }, []);

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground">
          Avis clients
        </h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1.5">
            <StarRating value={Math.round(avgRating)} />
            <span className="text-sm font-medium text-foreground">
              {avgRating.toFixed(1)} · {reviews.length} avis
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-12">Chargement...</p>
      ) : reviews.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Aucun avis pour le moment</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-border bg-card p-3 space-y-2 cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => navigate(`/product/${review.product_id}`)}
            >
              {/* Product info */}
              <div className="flex items-center gap-2.5">
                {review.product_image ? (
                  <img
                    src={review.product_image}
                    alt={review.product_name}
                    className="w-9 h-9 rounded-lg object-cover border border-border"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center border border-border">
                    <Package size={14} className="text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {review.product_name}
                  </p>
                  <div className="flex items-center gap-2">
                    <StarRating value={review.rating} />
                    <span className="text-[10px] text-muted-foreground">
                      {timeAgo(review.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* User + comment */}
              <div className="flex items-start gap-2 pl-1">
                <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center mt-0.5 shrink-0">
                  {review.is_anonymous ? (
                    <EyeOff size={10} className="text-muted-foreground" />
                  ) : (
                    <User size={10} className="text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">
                    {review.is_anonymous ? "Anonyme" : review.username}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {review.comment}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
