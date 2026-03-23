import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DBCategory {
  id: string;
  name: string;
  sort_order: number;
  subcategories: DBSubcategory[];
}

export interface DBSubcategory {
  id: string;
  category_id: string;
  name: string;
  sort_order: number;
}

export interface DBFarm {
  id: string;
  name: string;
  sort_order: number;
}

export interface DBProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  sort_order: number;
}

export function useShopData() {
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [farms, setFarms] = useState<DBFarm[]>([]);
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-shop", {
        body: { action: "get_public_shop_data" },
      });

      if (error || !data?.success) {
        console.error("Shop data fetch error:", error || data?.error);
        setCategories([]);
        setFarms([]);
        setProducts([]);
        return;
      }

      const cats: DBCategory[] = (data.categories || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        sort_order: c.sort_order,
        subcategories: (data.subcategories || [])
          .filter((s: any) => s.category_id === c.id)
          .map((s: any) => ({ id: s.id, category_id: s.category_id, name: s.name, sort_order: s.sort_order })),
      }));

      setCategories(cats);
      setFarms((data.farms || []).map((f: any) => ({ id: f.id, name: f.name, sort_order: f.sort_order })));
      setProducts((data.products || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: Number(p.price),
        image_url: p.image_url,
        category_id: p.category_id,
        subcategory_id: p.subcategory_id,
        sort_order: p.sort_order,
      })));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { categories, farms, products, loading, refetch: fetchData };
}
