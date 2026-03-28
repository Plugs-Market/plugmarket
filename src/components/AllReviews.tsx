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
    const fetch = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("product-reviews", {
          body: { action: "get_all_reviews" },
        });
        if (!error && data?.success) {
          setReviews(data.reviews);
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    fetch();
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
