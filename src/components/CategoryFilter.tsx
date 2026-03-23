import { DBCategory } from "@/hooks/useShopData";

interface CategoryFilterProps {
  categories: DBCategory[];
  selectedCategoryId: string;
  selectedSubcategoryId: string;
  onCategoryChange: (id: string) => void;
  onSubcategoryChange: (id: string) => void;
}

const CategoryFilter = ({
  categories,
  selectedCategoryId,
  selectedSubcategoryId,
  onCategoryChange,
  onSubcategoryChange,
}: CategoryFilterProps) => {
  const activeCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div className="px-4 py-4 space-y-3">
      {/* Menu selector (full width) */}
      <select
        value={selectedCategoryId}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="w-full rounded-xl bg-secondary border border-border px-4 py-3 text-foreground text-sm font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
      >
        <option value="">Tous les Menus</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      {/* Subcategories as pills when a menu is selected */}
      {activeCategory && activeCategory.subcategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => onSubcategoryChange("")}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              selectedSubcategoryId === ""
                ? "neon-gradient text-primary-foreground neon-shadow"
                : "bg-secondary text-foreground border border-border hover:border-primary"
            }`}
          >
            Tout
          </button>
          {activeCategory.subcategories.map((sub) => (
            <button
              key={sub.id}
              onClick={() => onSubcategoryChange(sub.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                selectedSubcategoryId === sub.id
                  ? "neon-gradient text-primary-foreground neon-shadow"
                  : "bg-secondary text-foreground border border-border hover:border-primary"
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryFilter;
