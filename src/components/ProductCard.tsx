import { DBProduct } from "@/hooks/useShopData";
import { Package } from "lucide-react";

interface ProductCardProps {
  product: DBProduct;
  index: number;
}

const ProductCard = ({ product, index }: ProductCardProps) => {
  return (
    <div
      className="card-neon-border rounded-xl overflow-hidden bg-card animate-fade-in hover:neon-glow transition-shadow duration-300"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="relative aspect-square overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <Package size={32} className="text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="p-3 space-y-2">
        <h3 className="font-display font-semibold text-xs sm:text-sm text-foreground truncate">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-[10px] text-muted-foreground line-clamp-2">{product.description}</p>
        )}
        <div className="card-neon-border rounded-full px-2.5 py-1 inline-flex items-center gap-1.5 text-[10px] text-primary">
          <span className="font-bold">{product.price.toFixed(2)} €</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
