import type { Product } from "@/data/products";

interface ProductCardProps {
  product: Product;
  index: number;
}

const ProductCard = ({ product, index }: ProductCardProps) => {
  return (
    <div
      className="card-neon-border rounded-xl overflow-hidden bg-card animate-fade-in hover:neon-glow transition-shadow duration-300"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        <span className="absolute top-2 left-2 neon-gradient text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
          {product.origin} {product.flag}
        </span>
      </div>
      <div className="p-3 space-y-2">
        <h3 className="font-display font-semibold text-xs sm:text-sm text-foreground truncate">
          {product.name}
        </h3>
        <div className="card-neon-border rounded-full px-2.5 py-1 inline-flex items-center gap-1.5 text-[10px] text-primary">
          <span>🌿</span>
          <span className="font-medium uppercase tracking-wide">{product.farm}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
