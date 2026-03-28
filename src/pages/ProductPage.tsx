import { useParams, useNavigate } from "react-router-dom";
import { useShopData } from "@/hooks/useShopData";
import BottomNav from "@/components/BottomNav";
import ProductReviews from "@/components/ProductReviews";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, categories, loading } = useShopData();

  const product = products.find((p) => p.id === id);
  const productCategories = product
    ? categories.filter((c) => product.category_ids.includes(c.id))
    : [];
  const productSubcategories = productCategories.flatMap((c) =>
    c.subcategories.filter((s) => product?.subcategory_ids.includes(s.id)),
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Produit introuvable</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="font-display font-bold text-foreground truncate">
          {product.name}
        </h1>
      </div>

      {/* Image */}
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full aspect-square object-cover"
        />
      ) : (
        <div className="w-full aspect-square bg-secondary flex items-center justify-center">
          <Package size={64} className="text-muted-foreground" />
        </div>
      )}

      {/* Details */}
      <div className="px-4 py-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-foreground">
            {product.name}
          </h2>
          {product.variants.length === 0 && (
            <span className="text-lg font-bold text-primary whitespace-nowrap">
              {product.price.toFixed(2)} €
            </span>
          )}
        </div>

        {/* Variants */}
        {product.variants.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Déclinaisons</h3>
            <div className="grid gap-2">
              {product.variants.map((v, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-secondary border border-border">
                  <span className="text-sm font-medium text-foreground">{v.label}</span>
                  <span className="text-sm font-bold text-primary">{v.price.toFixed(2)} €</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(productCategories.length > 0 || productSubcategories.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {productCategories.map((c) => (
              <span key={c.id} className="px-3 py-1 rounded-full bg-secondary text-xs font-medium text-foreground border border-border">
                {c.name}
              </span>
            ))}
            {productSubcategories.map((s) => (
              <span key={s.id} className="px-3 py-1 rounded-full bg-primary/10 text-xs font-medium text-primary border border-primary/20">
                {s.name}
              </span>
            ))}
          </div>
        )}

        {product.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {product.description}
          </p>
        )}

        {product.video_url && (
          <div className="rounded-xl overflow-hidden border border-border">
            <video
              src={product.video_url}
              controls
              playsInline
              preload="metadata"
              className="w-full"
            />
          </div>
        )}

        {/* Avis */}
        <ProductReviews productId={product.id} />
      </div>

      <BottomNav activeTab="menu" onTabChange={() => navigate("/")} />
    </div>
  );
};

export default ProductPage;
