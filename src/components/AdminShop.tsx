import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Store, ArrowLeft, Plus, Trash2, Edit2, Package, FolderTree, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { products as initialProducts, categories as initialCategories, farms as initialFarms, Product, Category } from "@/data/products";

const AdminShop = ({ onBack }: { onBack: () => void }) => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<"products" | "categories" | "farms">("products");

  if (user?.grade !== "Admin") return null;

  return (
    <div className="px-4 py-6 pb-28 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft size={20} />
        </Button>
        <Store className="text-primary" size={24} />
        <h2 className="font-display text-xl font-bold neon-text">Gestion Boutique</h2>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { id: "products" as const, label: "Produits", icon: Package },
          { id: "categories" as const, label: "Menu & Catégories", icon: FolderTree },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              activeSection === id
                ? "neon-gradient text-primary-foreground neon-shadow"
                : "bg-secondary text-foreground border border-border hover:border-primary"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {activeSection === "products" && <ProductsSection />}
      {activeSection === "categories" && <CategoriesSection />}
    </div>
  );
};

const ProductsSection = () => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-primary font-medium">
          {initialProducts.length} produit{initialProducts.length > 1 ? "s" : ""}
        </p>
        <Button size="sm" className="gap-1.5 text-xs">
          <Plus size={14} />
          Ajouter
        </Button>
      </div>

      {initialProducts.map((product) => (
        <div key={product.id} className="p-3 rounded-xl bg-card card-neon-border flex items-center gap-3">
          <img
            src={product.image}
            alt={product.name}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{product.name}</p>
            <p className="text-xs text-muted-foreground">
              {product.category} • {product.subcategory} • {product.farm}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Edit2 size={14} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

const CategoriesSection = () => {
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Menus / Categories */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Menus</h3>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <Plus size={14} />
            Ajouter menu
          </Button>
        </div>
        <div className="space-y-2">
          {initialCategories.map((cat) => (
            <div key={cat.name} className="rounded-xl bg-card card-neon-border overflow-hidden">
              <button
                onClick={() => setExpandedCat(expandedCat === cat.name ? null : cat.name)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <FolderTree size={16} className="text-primary" />
                  <span className="font-semibold text-foreground text-sm">{cat.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({cat.subcategories.length} sous-catégories)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); }}>
                    <Edit2 size={12} />
                  </Button>
                  {expandedCat === cat.name ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                </div>
              </button>
              {expandedCat === cat.name && (
                <div className="px-4 pb-4 border-t border-border pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground font-medium">Sous-catégories</span>
                    <Button size="sm" variant="ghost" className="gap-1 text-xs h-7">
                      <Plus size={12} />
                      Ajouter
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cat.subcategories.map((sub) => (
                      <div
                        key={sub}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border text-xs font-medium text-foreground"
                      >
                        {sub}
                        <button className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Farms / Categories */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Catégories (Farms)</h3>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <Plus size={14} />
            Ajouter
          </Button>
        </div>
        <div className="space-y-2">
          {initialFarms.map((farm) => (
            <div key={farm} className="p-3 rounded-xl bg-card card-neon-border flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{farm}</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit2 size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminShop;
