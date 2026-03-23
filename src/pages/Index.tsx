import { useState, useMemo } from "react";
import HeroBanner from "@/components/HeroBanner";
import CategoryFilter from "@/components/CategoryFilter";
import ProductCard from "@/components/ProductCard";
import BottomNav from "@/components/BottomNav";
import FAQSection from "@/components/FAQSection";
import ContactSection from "@/components/ContactSection";
import { products } from "@/data/products";

type Tab = "menu" | "reviews" | "faq" | "contact";

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("menu");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedFarm, setSelectedFarm] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory && p.category !== selectedCategory) return false;
      if (selectedFarm && p.farm !== selectedFarm) return false;
      if (selectedSubcategory && p.subcategory !== selectedSubcategory) return false;
      return true;
    });
  }, [selectedCategory, selectedFarm, selectedSubcategory]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <HeroBanner />

      {activeTab === "menu" && (
        <>
          <CategoryFilter
            selectedCategory={selectedCategory}
            selectedFarm={selectedFarm}
            selectedSubcategory={selectedSubcategory}
            onCategoryChange={setSelectedCategory}
            onFarmChange={setSelectedFarm}
            onSubcategoryChange={setSelectedSubcategory}
          />

          <div className="px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">
                Produits
              </h2>
              <span className="text-primary text-sm font-semibold">
                {filteredProducts.length} résultats
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {filteredProducts.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">Aucun produit trouvé</p>
                <p className="text-sm mt-1">Essayez de modifier vos filtres</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "reviews" && (
        <div className="px-4 py-6">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6 neon-text">Avis clients</h2>
          <p className="text-muted-foreground text-center py-12">Bientôt disponible</p>
        </div>
      )}

      {activeTab === "faq" && <FAQSection />}
      {activeTab === "contact" && <ContactSection />}

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
