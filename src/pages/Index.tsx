import { useState, useMemo } from "react";
import HeroBanner from "@/components/HeroBanner";
import CategoryFilter from "@/components/CategoryFilter";
import ProductCard from "@/components/ProductCard";
import BottomNav from "@/components/BottomNav";
import FAQSection from "@/components/FAQSection";
import ContactSection from "@/components/ContactSection";
import ProfileSection from "@/components/ProfileSection";
import { useShopData } from "@/hooks/useShopData";

type Tab = "menu" | "reviews" | "faq" | "contact";

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("menu");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);

  const { categories, products, loading } = useShopData();

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategoryId && p.category_id !== selectedCategoryId) return false;
      if (selectedSubcategoryId && p.subcategory_id !== selectedSubcategoryId) return false;
      return true;
    });
  }, [products, selectedCategoryId, selectedSubcategoryId]);

  if (showAdmin) {
    return (
      <ProfileSection
        showAdminPanel={true}
        onAdminBack={() => setShowAdmin(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <HeroBanner />

      {activeTab === "menu" && (
        <>
          <CategoryFilter
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            selectedSubcategoryId={selectedSubcategoryId}
            onCategoryChange={(id) => {
              setSelectedCategoryId(id);
              setSelectedSubcategoryId("");
            }}
            onSubcategoryChange={setSelectedSubcategoryId}
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

            {loading ? (
              <p className="text-muted-foreground text-center py-12">Chargement...</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {filteredProducts.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            )}

            {!loading && filteredProducts.length === 0 && (
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
      {activeTab === "contact" && (
        <ProfileSection onOpenAdmin={() => setShowAdmin(true)} />
      )}

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
