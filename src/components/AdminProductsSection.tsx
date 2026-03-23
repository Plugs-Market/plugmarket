import { useState } from "react";
import { DBProduct, DBCategory } from "@/hooks/useShopData";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2, Package, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  products: DBProduct[];
  categories: DBCategory[];
  onRefetch: () => void;
}

const AdminProductsSection = ({ products, categories, onRefetch }: Props) => {
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<DBProduct | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", category_id: "", subcategory_id: "", image_url: "" });
  const [uploading, setUploading] = useState(false);

  const callAdmin = async (action: string, extra: Record<string, unknown> = {}) => {
    const token = localStorage.getItem("plugs_market_token");
    const { data, error } = await supabase.functions.invoke("admin-shop", {
      body: { action, session_token: token, ...extra },
    });
    if (error || !data?.success) {
      toast.error(data?.error || "Erreur");
      return data;
    }
    return data;
  };

  const openAdd = () => {
    setEditProduct(null);
    setForm({ name: "", description: "", price: "", category_id: "", subcategory_id: "", image_url: "" });
    setShowModal(true);
  };

  const openEdit = (p: DBProduct) => {
    setEditProduct(p);
    setForm({
      name: p.name,
      description: p.description || "",
      price: String(p.price),
      category_id: p.category_id || "",
      subcategory_id: p.subcategory_id || "",
      image_url: p.image_url || "",
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image trop lourde (max 5MB)");
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const data = await callAdmin("upload_product_image", {
          image_base64: base64,
          file_name: file.name,
          content_type: file.type,
        });
        if (data?.url) {
          setForm((f) => ({ ...f, image_url: data.url }));
          toast.success("Image uploadée");
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
      toast.error("Erreur upload");
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price) || 0,
      image_url: form.image_url || null,
      category_id: form.category_id || null,
      subcategory_id: form.subcategory_id || null,
    };

    if (editProduct) {
      await callAdmin("update_product", { id: editProduct.id, ...payload });
      toast.success("Produit modifié");
    } else {
      await callAdmin("add_product", payload);
      toast.success("Produit ajouté");
    }
    setShowModal(false);
    onRefetch();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer "${name}" ?`)) return;
    await callAdmin("delete_product", { id });
    toast.success("Produit supprimé");
    onRefetch();
  };

  const selectedCat = categories.find((c) => c.id === form.category_id);

  return (
    <div className="space-y-4">
      <Button className="w-full gap-2" onClick={openAdd}>
        <Plus size={16} /> Ajouter un produit
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct ? "Modifier le produit" : "Nouveau produit"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nom du produit..."
              autoFocus
            />
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description..."
              rows={3}
            />
            <Input
              type="number"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="Prix (€)..."
              step="0.01"
              min="0"
            />

            {/* Category */}
            <Select
              value={form.category_id}
              onValueChange={(v) => setForm((f) => ({ ...f, category_id: v, subcategory_id: "" }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Menu (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Subcategory */}
            {selectedCat && selectedCat.subcategories.length > 0 && (
              <Select
                value={form.subcategory_id}
                onValueChange={(v) => setForm((f) => ({ ...f, subcategory_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sous-catégorie (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCat.subcategories.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Image */}
            <div className="space-y-2">
              {form.image_url && (
                <img src={form.image_url} alt="Preview" className="w-full h-32 object-cover rounded-lg border border-border" />
              )}
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border cursor-pointer hover:border-primary transition-colors">
                <ImageIcon size={16} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {uploading ? "Upload en cours..." : "Ajouter une image"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button disabled={!form.name.trim() || uploading} onClick={handleSave}>
              {editProduct ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        {products.map((p) => (
          <div key={p.id} className="p-3 rounded-xl bg-card card-neon-border flex items-center gap-3">
            {p.image_url ? (
              <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Package size={18} className="text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
              <p className="text-xs text-primary font-semibold">{p.price.toFixed(2)} €</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                <Edit2 size={14} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id, p.name)}>
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <p className="text-muted-foreground text-center text-sm py-8">Aucun produit</p>
        )}
      </div>
    </div>
  );
};

export default AdminProductsSection;
