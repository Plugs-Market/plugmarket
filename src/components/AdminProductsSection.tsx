import { useState, useMemo } from "react";
import { DBProduct, DBCategory, DBProductVariant } from "@/hooks/useShopData";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit2, Package, ImageIcon, X, Copy, Video } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  products: DBProduct[];
  categories: DBCategory[];
  onRefetch: () => void;
  isReadOnly?: boolean;
}

interface VariantForm {
  label: string;
  price: string;
}

interface ProductForm {
  name: string;
  description: string;
  price: string;
  image_url: string;
  video_url: string;
  category_ids: string[];
  subcategory_ids: string[];
  variants: VariantForm[];
}

const emptyForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  image_url: "",
  video_url: "",
  category_ids: [],
  subcategory_ids: [],
  variants: [],
};

const AdminProductsSection = ({ products, categories, onRefetch, isReadOnly = false }: Props) => {
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<DBProduct | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

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
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (p: DBProduct) => {
    setEditProduct(p);
    setForm({
      name: p.name,
      description: p.description || "",
      price: String(p.price),
      image_url: p.image_url || "",
      video_url: p.video_url || "",
      category_ids: [...p.category_ids],
      subcategory_ids: [...p.subcategory_ids],
      variants: (p.variants || []).map((v) => ({ label: v.label, price: String(v.price) })),
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

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Vidéo trop lourde (max 50MB)");
      return;
    }
    setUploadingVideo(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const data = await callAdmin("upload_product_video", {
          video_base64: base64,
          file_name: file.name,
          content_type: file.type,
        });
        if (data?.url) {
          setForm((f) => ({ ...f, video_url: data.url }));
          toast.success("Vidéo uploadée");
        }
        setUploadingVideo(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingVideo(false);
      toast.error("Erreur upload vidéo");
    }
  };

  const toggleCategoryId = (id: string) => {
    setForm((f) => {
      const has = f.category_ids.includes(id);
      const newCatIds = has ? f.category_ids.filter((c) => c !== id) : [...f.category_ids, id];
      // Remove subcategories that no longer belong to selected categories
      const validSubCatIds = categories
        .filter((c) => newCatIds.includes(c.id))
        .flatMap((c) => c.subcategories.map((s) => s.id));
      return {
        ...f,
        category_ids: newCatIds,
        subcategory_ids: f.subcategory_ids.filter((s) => validSubCatIds.includes(s)),
      };
    });
  };

  const toggleSubcategoryId = (id: string) => {
    setForm((f) => ({
      ...f,
      subcategory_ids: f.subcategory_ids.includes(id)
        ? f.subcategory_ids.filter((s) => s !== id)
        : [...f.subcategory_ids, id],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price) || 0,
      image_url: form.image_url || null,
      video_url: form.video_url || null,
      category_ids: form.category_ids,
      subcategory_ids: form.subcategory_ids,
      variants: form.variants
        .filter((v) => v.label.trim())
        .map((v) => ({ label: v.label.trim(), price: parseFloat(v.price) || 0 })),
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

  const addVariant = () => {
    setForm((f) => ({ ...f, variants: [...f.variants, { label: "", price: "" }] }));
  };

  const removeVariant = (index: number) => {
    setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== index) }));
  };

  const updateVariant = (index: number, field: keyof VariantForm, value: string) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }));
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer "${name}" ?`)) return;
    await callAdmin("delete_product", { id });
    toast.success("Produit supprimé");
    onRefetch();
  };

  const handleDuplicate = async (p: DBProduct) => {
    const payload = {
      name: p.name + " (copie)",
      description: p.description || null,
      price: p.price,
      image_url: p.image_url || null,
      video_url: p.video_url || null,
      category_ids: [...p.category_ids],
      subcategory_ids: [...p.subcategory_ids],
      variants: (p.variants || []).map((v) => ({ label: v.label, price: v.price })),
    };
    const res = await callAdmin("add_product", payload);
    if (res?.success) {
      toast.success("Produit dupliqué");
      onRefetch();
    }
  };

  // Get available subcategories from selected categories
  const availableSubcategories = useMemo(() => {
    return categories
      .filter((c) => form.category_ids.includes(c.id))
      .flatMap((c) => c.subcategories.map((s) => ({ ...s, categoryName: c.name })));
  }, [categories, form.category_ids]);

  return (
    <div className="space-y-4">
      {!isReadOnly && (
        <Button className="w-full gap-2" onClick={openAdd}>
          <Plus size={16} /> Ajouter un produit
        </Button>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isReadOnly ? "Détails du produit" : editProduct ? "Modifier le produit" : "Nouveau produit"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nom du produit..."
              autoFocus
              disabled={isReadOnly}
            />
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description..."
              rows={3}
              disabled={isReadOnly}
            />
            <Input
              type="number"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="Prix (€)..."
              step="0.01"
              min="0"
              disabled={isReadOnly}
            />

            {/* Multi-select Menus */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Menus</label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto rounded-lg border border-border p-2">
                {categories.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-secondary transition-colors">
                    <Checkbox
                      checked={form.category_ids.includes(c.id)}
                      onCheckedChange={() => toggleCategoryId(c.id)}
                      disabled={isReadOnly}
                    />
                    <span className="text-sm text-foreground">{c.name}</span>
                  </label>
                ))}
                {categories.length === 0 && (
                  <p className="text-xs text-muted-foreground py-1">Aucun menu</p>
                )}
              </div>
            </div>

            {/* Multi-select Sous-catégories */}
            {availableSubcategories.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Sous-catégories</label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto rounded-lg border border-border p-2">
                  {availableSubcategories.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-secondary transition-colors">
                      <Checkbox
                        checked={form.subcategory_ids.includes(s.id)}
                        onCheckedChange={() => toggleSubcategoryId(s.id)}
                        disabled={isReadOnly}
                      />
                      <span className="text-sm text-foreground">{s.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{s.categoryName}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Selected tags preview */}
            {(form.category_ids.length > 0 || form.subcategory_ids.length > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {form.category_ids.map((cid) => {
                  const cat = categories.find((c) => c.id === cid);
                  return cat ? (
                    <span key={cid} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-medium border border-primary/20">
                      {cat.name}
                      <button onClick={() => toggleCategoryId(cid)} className="hover:text-destructive"><X size={10} /></button>
                    </span>
                  ) : null;
                })}
                {form.subcategory_ids.map((sid) => {
                  const sub = availableSubcategories.find((s) => s.id === sid);
                  return sub ? (
                    <span key={sid} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-foreground text-[10px] font-medium border border-border">
                      {sub.name}
                      <button onClick={() => toggleSubcategoryId(sid)} className="hover:text-destructive"><X size={10} /></button>
                    </span>
                  ) : null;
                })}
              </div>
            )}

            {/* Variants / Déclinaisons de prix */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Déclinaisons de prix</label>
              {form.variants.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={v.label}
                    onChange={(e) => updateVariant(i, "label", e.target.value)}
                    placeholder="Paramètre (ex: 1g, 3.5g...)"
                    className="flex-1"
                    disabled={isReadOnly}
                  />
                  <Input
                    type="number"
                    value={v.price}
                    onChange={(e) => updateVariant(i, "price", e.target.value)}
                    placeholder="Prix"
                    step="0.01"
                    min="0"
                    className="w-24"
                    disabled={isReadOnly}
                  />
                  {!isReadOnly && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeVariant(i)}>
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              ))}
              {!isReadOnly && (
                <Button type="button" variant="outline" size="sm" className="w-full gap-1" onClick={addVariant}>
                  <Plus size={14} /> Ajouter une déclinaison
                </Button>
              )}
            </div>

            {/* Image */}
            <div className="space-y-2">
              {form.image_url && (
                <img src={form.image_url} alt="Preview" className="w-full h-32 object-cover rounded-lg border border-border" />
              )}
              {!isReadOnly && (
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
              )}
            </div>

            {/* Video */}
            <div className="space-y-2">
              {form.video_url && (
                <div className="relative">
                  <video src={form.video_url} className="w-full h-32 object-cover rounded-lg border border-border" controls />
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, video_url: "" }))}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}
              {!isReadOnly && (
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border cursor-pointer hover:border-primary transition-colors">
                  <Video size={16} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {uploadingVideo ? "Upload vidéo en cours..." : "Ajouter une vidéo"}
                  </span>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoUpload}
                    disabled={uploadingVideo}
                  />
                </label>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              {isReadOnly ? "Fermer" : "Annuler"}
            </Button>
            {!isReadOnly && (
              <Button disabled={!form.name.trim() || uploading || uploadingVideo} onClick={handleSave}>
                {editProduct ? "Enregistrer" : "Créer"}
              </Button>
            )}
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
            {!isReadOnly ? (
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                  <Edit2 size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(p)}>
                  <Copy size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id, p.name)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => openEdit(p)}>
                <Edit2 size={14} />
              </Button>
            )}
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
