import { categories, farms } from "@/data/products";

interface CategoryFilterProps {
  selectedCategory: string;
  selectedFarm: string;
  selectedSubcategory: string;
  onCategoryChange: (cat: string) => void;
  onFarmChange: (farm: string) => void;
  onSubcategoryChange: (sub: string) => void;
}

const CategoryFilter = ({
  selectedCategory,
  selectedFarm,
  selectedSubcategory,
  onCategoryChange,
  onFarmChange,
  onSubcategoryChange,
}: CategoryFilterProps) => {
  const activeCategory = categories.find((c) => c.name === selectedCategory);

  return (
    <div className="px-4 py-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <select
          value={selectedCategory}
          onChange={(e) => {
            onCategoryChange(e.target.value);
            onSubcategoryChange("");
          }}
          className="w-full rounded-lg bg-secondary border border-border px-4 py-3 text-foreground text-sm font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((cat) => (
            <option key={cat.name} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          value={selectedFarm}
          onChange={(e) => onFarmChange(e.target.value)}
          className="w-full rounded-lg bg-secondary border border-border px-4 py-3 text-foreground text-sm font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Toutes les farms</option>
          {farms.map((farm) => (
            <option key={farm} value={farm}>
              {farm}
            </option>
          ))}
        </select>
      </div>

      {activeCategory && activeCategory.subcategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => onSubcategoryChange("")}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedSubcategory === ""
                ? "gold-gradient text-primary-foreground"
                : "bg-secondary text-foreground border border-border hover:border-primary"
            }`}
          >
            Tout
          </button>
          {activeCategory.subcategories.map((sub) => (
            <button
              key={sub}
              onClick={() => onSubcategoryChange(sub)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedSubcategory === sub
                  ? "gold-gradient text-primary-foreground"
                  : "bg-secondary text-foreground border border-border hover:border-primary"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryFilter;
