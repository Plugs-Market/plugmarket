import type { Product } from "@/data/products";

interface ProductCardProps {
  product: Product;
  index: number;
}

const ProductCard = ({ product, index }: ProductCardProps) => {
  return (
    <div
      className="card-gold-border rounded-lg overflow-hidden bg-card animate-fade-in gold-shadow"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        <span className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm text-foreground text-xs px-2 py-1 rounded-full">
          {product.origin} {product.flag}
        </span>
      </div>
      <div className="p-3 text-center space-y-2">
        <h3 className="font-display font-semibold text-sm sm:text-base text-foreground">
          {product.name}
        </h3>
        <div className="card-gold-border rounded-full px-3 py-1.5 inline-flex items-center gap-1.5 text-xs text-primary">
          <span>🔥</span>
          <span>{product.farm}</span>
          <span>{product.flag}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
