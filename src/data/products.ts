export interface Product {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  farm: string;
  origin: string;
  flag: string;
  image: string;
}

export interface Category {
  name: string;
  subcategories: string[];
}

export const categories: Category[] = [
  { name: "Fleurs", subcategories: ["Indoor", "Outdoor", "Greenhouse"] },
  { name: "Résines", subcategories: ["Hash", "Dry Sift", "Charas"] },
  { name: "Extraits", subcategories: ["Rosin", "BHO", "Distillat"] },
  { name: "Comestibles", subcategories: ["Gummies", "Chocolats", "Boissons"] },
];

export const farms = ["Calitefarm", "GreenHouse Co.", "Pacific Farms", "Mountain Top"];

export const products: Product[] = [
  { id: "1", name: "Brides Maid", category: "Fleurs", subcategory: "Indoor", farm: "Calitefarm", origin: "Static US", flag: "🇺🇸", image: "https://images.unsplash.com/photo-1603909223429-69bb7101f420?w=400&h=400&fit=crop" },
  { id: "2", name: "Autumn", category: "Fleurs", subcategory: "Indoor", farm: "Calitefarm", origin: "Static US", flag: "🇺🇸", image: "https://images.unsplash.com/photo-1587324438673-56c78a866b15?w=400&h=400&fit=crop" },
  { id: "3", name: "OG Kush", category: "Fleurs", subcategory: "Indoor", farm: "Calitefarm", origin: "Static US", flag: "🇺🇸", image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop" },
  { id: "4", name: "London Pound", category: "Fleurs", subcategory: "Greenhouse", farm: "Calitefarm", origin: "Static US", flag: "🇺🇸", image: "https://images.unsplash.com/photo-1601055283742-8b27e81b5553?w=400&h=400&fit=crop" },
  { id: "5", name: "Purple Haze", category: "Fleurs", subcategory: "Outdoor", farm: "Pacific Farms", origin: "Californie", flag: "🇺🇸", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=400&fit=crop" },
  { id: "6", name: "Blue Dream", category: "Fleurs", subcategory: "Indoor", farm: "GreenHouse Co.", origin: "Oregon", flag: "🇺🇸", image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=400&fit=crop" },
  { id: "7", name: "Temple Ball", category: "Résines", subcategory: "Charas", farm: "Mountain Top", origin: "Népal", flag: "🇳🇵", image: "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=400&h=400&fit=crop" },
  { id: "8", name: "Dry Sift Gold", category: "Résines", subcategory: "Dry Sift", farm: "Calitefarm", origin: "Maroc", flag: "🇲🇦", image: "https://images.unsplash.com/photo-1416339306562-f3d12fefd36f?w=400&h=400&fit=crop" },
  { id: "9", name: "Live Rosin", category: "Extraits", subcategory: "Rosin", farm: "Pacific Farms", origin: "Static US", flag: "🇺🇸", image: "https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=400&h=400&fit=crop" },
  { id: "10", name: "Gummy Bears", category: "Comestibles", subcategory: "Gummies", farm: "GreenHouse Co.", origin: "Californie", flag: "🇺🇸", image: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&h=400&fit=crop" },
  { id: "11", name: "Gelato", category: "Fleurs", subcategory: "Indoor", farm: "Calitefarm", origin: "Static US", flag: "🇺🇸", image: "https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?w=400&h=400&fit=crop" },
  { id: "12", name: "Zkittlez", category: "Fleurs", subcategory: "Greenhouse", farm: "Pacific Farms", origin: "Californie", flag: "🇺🇸", image: "https://images.unsplash.com/photo-1503262028195-93c528f03218?w=400&h=400&fit=crop" },
];
