import { useState, useEffect, useCallback, useRef } from "react";
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
  category_ids: string[];
  subcategory_ids: string[];
  sort_order: number;
}

const CACHE_KEY = "shop_data_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  categories: DBCategory[];
  farms: DBFarm[];
  products: DBProduct[];
  timestamp: number;
}

function readCache(): CachedData | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedData = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(data: CachedData) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch { /* quota exceeded, ignore */ }
}

function transformData(data: any): { categories: DBCategory[]; farms: DBFarm[]; products: DBProduct[] } {
  const subsMap = new Map<string, DBSubcategory[]>();
  for (const s of data.subcategories || []) {
    const arr = subsMap.get(s.category_id) || [];
    arr.push({ id: s.id, category_id: s.category_id, name: s.name, sort_order: s.sort_order });
    subsMap.set(s.category_id, arr);
  }

  const categories: DBCategory[] = (data.categories || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    sort_order: c.sort_order,
    subcategories: subsMap.get(c.id) || [],
  }));

  const farms: DBFarm[] = (data.farms || []).map((f: any) => ({ id: f.id, name: f.name, sort_order: f.sort_order }));

  const products: DBProduct[] = (data.products || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    image_url: p.image_url,
    category_ids: p.category_ids || [],
    subcategory_ids: p.subcategory_ids || [],
    sort_order: p.sort_order,
  }));

  return { categories, farms, products };
}

export function useShopData() {
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [farms, setFarms] = useState<DBFarm[]>([]);
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  const applyData = useCallback((d: { categories: DBCategory[]; farms: DBFarm[]; products: DBProduct[] }) => {
    setCategories(d.categories);
    setFarms(d.farms);
    setProducts(d.products);
  }, []);

  const fetchData = useCallback(async (skipCache = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    // Try cache first for instant display
    if (!skipCache) {
      const cached = readCache();
      if (cached) {
        applyData(cached);
        setLoading(false);
        // Refresh in background
        fetchingRef.current = false;
        fetchData(true);
        return;
      }
    }

    if (!skipCache) setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("admin-shop", {
        body: { action: "get_public_shop_data" },
      });
      if (error || !data?.success) throw new Error(error?.message || data?.error || "fetch failed");

      const transformed = transformData(data);
      applyData(transformed);
      writeCache({ ...transformed, timestamp: Date.now() });
    } catch (error) {
      console.error("Shop data fetch error:", error);
      // Only clear if no cached data displayed
      if (!readCache()) {
        setCategories([]);
        setFarms([]);
        setProducts([]);
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [applyData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    sessionStorage.removeItem(CACHE_KEY);
    return fetchData(true);
  }, [fetchData]);

  return { categories, farms, products, loading, refetch };
}
