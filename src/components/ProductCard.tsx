import { useNavigate } from "react-router-dom";
import { DBProduct } from "@/hooks/useShopData";
import { Package } from "lucide-react";

interface ProductCardProps {
  product: DBProduct;
  index: number;
}

const ProductCard = ({ product, index }: ProductCardProps) => {
  const navigate = useNavigate();

  const goToProduct = () => navigate(`/product/${product.id}`);

  return (
    <div
      className="card-neon-border rounded-xl overflow-hidden bg-card animate-fade-in hover:neon-glow transition-shadow duration-300"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div
        className="relative aspect-square overflow-hidden cursor-pointer"
        onClick={goToProduct}
      >
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
        <h3
          className="font-display font-semibold text-xs sm:text-sm text-foreground truncate cursor-pointer hover:text-primary transition-colors"
          onClick={goToProduct}
        >
          {product.name}
        </h3>
        {product.description && (
          <p className="text-[10px] text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}
        {product.variants.length > 0 ? (
          <div className="space-y-0.5">
            {product.variants.map((v, i) => (
              <div key={i} className="card-neon-border rounded-full px-2.5 py-0.5 inline-flex items-center gap-1.5 text-[10px] text-primary mr-1">
                <span className="text-muted-foreground">{v.label}</span>
                <span className="font-bold">{v.price.toFixed(2)} €</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-neon-border rounded-full px-2.5 py-1 inline-flex items-center gap-1.5 text-[10px] text-primary">
            <span className="font-bold">{product.price.toFixed(2)} €</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
