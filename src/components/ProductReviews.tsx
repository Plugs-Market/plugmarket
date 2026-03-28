import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Star, Send, Trash2, User, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Review {
  id: string;
  rating: number;
  comment: string;
  is_anonymous: boolean;
  username: string | null;
  created_at: string;
  user_id: string;
}

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={`transition-colors ${readonly ? "cursor-default" : "cursor-pointer"}`}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => onChange?.(star)}
        >
          <Star
            size={readonly ? 14 : 24}
            className={`transition-colors ${
              (hover || value) >= star
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
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

export default function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const hasReviewed = reviews.some((r) => r.user_id === user?.id);

  const fetchReviews = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("product-reviews", {
        body: { action: "get_reviews", product_id: productId },
      });
      if (!error && data?.success) {
        setReviews(data.reviews);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmit = async () => {
    if (rating === 0) { toast.error("Sélectionnez une note"); return; }
    if (!comment.trim()) { toast.error("Écrivez un commentaire"); return; }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("plugs_market_token");
      const { data, error } = await supabase.functions.invoke("product-reviews", {
        body: {
          action: "add_review",
          product_id: productId,
          rating,
          comment: comment.trim(),
          is_anonymous: isAnonymous,
          session_token: token,
        },
      });
      if (error || !data?.success) {
        toast.error(data?.error || "Erreur lors de l'envoi");
      } else {
        toast.success("Avis publié !");
        setRating(0);
        setComment("");
        setIsAnonymous(false);
        fetchReviews();
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    const token = localStorage.getItem("plugs_market_token");
    const { data, error } = await supabase.functions.invoke("product-reviews", {
      body: { action: "delete_review", product_id: reviewId, session_token: token },
    });
    if (!error && data?.success) {
      toast.success("Avis supprimé");
      fetchReviews();
    } else {
      toast.error(data?.error || "Erreur");
    }
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-foreground">
          Avis ({reviews.length})
        </h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1.5">
            <StarRating value={Math.round(avgRating)} readonly />
            <span className="text-sm font-medium text-foreground">
              {avgRating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Form — only if logged in and hasn't reviewed */}
      {user && !hasReviewed && (
        <div className="rounded-xl border border-border bg-secondary/50 p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Laisser un avis</p>

          <StarRating value={rating} onChange={setRating} />

          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Votre commentaire..."
            maxLength={1000}
            className="resize-none bg-background"
            rows={3}
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              <EyeOff size={14} />
              Anonyme
            </label>

            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting || rating === 0 || !comment.trim()}
            >
              <Send size={14} />
              {submitting ? "Envoi..." : "Publier"}
            </Button>
          </div>
        </div>
      )}

      {!user && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Connectez-vous pour laisser un avis
        </p>
      )}

      {user && hasReviewed && (
        <p className="text-xs text-muted-foreground text-center">
          Vous avez déjà publié un avis sur ce produit
        </p>
      )}

      {/* Reviews list */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center">Chargement...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucun avis pour le moment
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-border bg-card p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                    {review.is_anonymous ? (
                      <EyeOff size={13} className="text-muted-foreground" />
                    ) : (
                      <User size={13} className="text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {review.is_anonymous ? "Anonyme" : review.username}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {timeAgo(review.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating value={review.rating} readonly />
                  {review.user_id === user?.id && (
                    <button onClick={() => handleDelete(review.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-9">
                {review.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
