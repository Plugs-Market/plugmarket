import { useParams, useNavigate } from "react-router-dom";
import { useShopData } from "@/hooks/useShopData";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, categories, loading } = useShopData();

  const product = products.find((p) => p.id === id);
  const category = product?.category_id
    ? categories.find((c) => c.id === product.category_id)
    : null;
  const subcategory = category?.subcategories.find(
    (s) => s.id === product?.subcategory_id,
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
          <span className="text-lg font-bold text-primary whitespace-nowrap">
            {product.price.toFixed(2)} €
          </span>
        </div>

        {(category || subcategory) && (
          <div className="flex flex-wrap gap-2">
            {category && (
              <span className="px-3 py-1 rounded-full bg-secondary text-xs font-medium text-foreground border border-border">
                {category.name}
              </span>
            )}
            {subcategory && (
              <span className="px-3 py-1 rounded-full bg-primary/10 text-xs font-medium text-primary border border-primary/20">
                {subcategory.name}
              </span>
            )}
          </div>
        )}

        {product.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {product.description}
          </p>
        )}
      </div>

      <BottomNav activeTab="menu" onTabChange={() => navigate("/")} />
    </div>
  );
};

export default ProductPage;
