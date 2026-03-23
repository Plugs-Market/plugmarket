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
      <div className="grid grid-cols-2 gap-3">
        <select
          value={selectedCategoryId}
          onChange={(e) => {
            onCategoryChange(e.target.value);
            onSubcategoryChange("");
          }}
          className="w-full rounded-xl bg-secondary border border-border px-4 py-3 text-foreground text-sm font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
        >
          <option value="">Tous les Menus</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          value={selectedSubcategoryId}
          onChange={(e) => onSubcategoryChange(e.target.value)}
          className="w-full rounded-xl bg-secondary border border-border px-4 py-3 text-foreground text-sm font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
          disabled={!activeCategory}
        >
          <option value="">Toutes les Catégories</option>
          {activeCategory?.subcategories.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default CategoryFilter;
