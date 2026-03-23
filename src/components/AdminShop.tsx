import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useShopData } from "@/hooks/useShopData";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Store, ArrowLeft, Plus, Trash2, Edit2, FolderTree, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const AdminShop = ({ onBack }: { onBack: () => void }) => {
  const { user } = useAuth();
  const { categories, farms, loading, refetch } = useShopData();
  const [activeSection, setActiveSection] = useState<"categories" | "farms">("categories");

  if (user?.grade !== "Admin") return null;

  const callAdmin = async (action: string, extra: Record<string, unknown> = {}) => {
    const token = localStorage.getItem("plugs_market_token");
    const { data, error } = await supabase.functions.invoke("admin-shop", {
      body: { action, session_token: token, ...extra },
    });
    if (error || !data?.success) {
      toast.error(data?.error || "Erreur");
      return false;
    }
    return true;
  };

  return (
    <div className="px-4 py-6 pb-28 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft size={20} />
        </Button>
        <Store className="text-primary" size={24} />
        <h2 className="font-display text-xl font-bold neon-text">Gestion Boutique</h2>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { id: "categories" as const, label: "Menus" },
          { id: "farms" as const, label: "Catégories" },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeSection === id
                ? "neon-gradient text-primary-foreground neon-shadow"
                : "bg-secondary text-foreground border border-border hover:border-primary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-12">Chargement...</p>
      ) : activeSection === "categories" ? (
        <CategoriesSection
          categories={categories}
          onAdd={async (name) => { if (await callAdmin("add_category", { name })) { toast.success("Menu ajouté"); refetch(); } }}
          onRename={async (id, name) => { if (await callAdmin("rename_category", { id, name })) { toast.success("Menu renommé"); refetch(); } }}
          onDelete={async (id) => { if (await callAdmin("delete_category", { id })) { toast.success("Menu supprimé"); refetch(); } }}
          onAddSub={async (category_id, name) => { if (await callAdmin("add_subcategory", { category_id, name })) { toast.success("Sous-catégorie ajoutée"); refetch(); } }}
          onDeleteSub={async (id) => { if (await callAdmin("delete_subcategory", { id })) { toast.success("Sous-catégorie supprimée"); refetch(); } }}
        />
      ) : (
        <FarmsSection
          farms={farms}
          onAdd={async (name) => { if (await callAdmin("add_farm", { name })) { toast.success("Catégorie ajoutée"); refetch(); } }}
          onRename={async (id, name) => { if (await callAdmin("rename_farm", { id, name })) { toast.success("Catégorie renommée"); refetch(); } }}
          onDelete={async (id) => { if (await callAdmin("delete_farm", { id })) { toast.success("Catégorie supprimée"); refetch(); } }}
        />
      )}
    </div>
  );
};

interface CatSectionProps {
  categories: { id: string; name: string; subcategories: { id: string; name: string }[] }[];
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onAddSub: (categoryId: string, name: string) => void;
  onDeleteSub: (id: string) => void;
}

const CategoriesSection = ({ categories, onAdd, onRename, onDelete, onAddSub, onDeleteSub }: CatSectionProps) => {
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nouveau menu..."
          className="flex-1 px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button size="sm" className="gap-1 shrink-0" onClick={() => { if (newName.trim()) { onAdd(newName); setNewName(""); } }}>
          <Plus size={14} /> Ajouter
        </Button>
      </div>

      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="rounded-xl bg-card card-neon-border overflow-hidden">
            <button
              onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FolderTree size={16} className="text-primary shrink-0" />
                {editingId === cat.id ? (
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { onRename(cat.id, editName); setEditingId(null); }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 px-2 py-1 rounded bg-secondary border border-primary text-sm text-foreground focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <>
                    <span className="font-semibold text-foreground text-sm truncate">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">({cat.subcategories.length})</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => {
                  e.stopPropagation();
                  setEditingId(cat.id);
                  setEditName(cat.name);
                }}>
                  <Edit2 size={12} />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Supprimer le menu "${cat.name}" et ses sous-catégories ?`)) onDelete(cat.id);
                }}>
                  <Trash2 size={12} />
                </Button>
                {expandedCat === cat.id ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
              </div>
            </button>
            {expandedCat === cat.id && (
              <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                <div className="flex gap-2">
                  <input
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    placeholder="Nouvelle sous-catégorie..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button size="sm" variant="ghost" className="gap-1 text-xs h-7" onClick={() => { if (newSubName.trim()) { onAddSub(cat.id, newSubName); setNewSubName(""); } }}>
                    <Plus size={12} /> Ajouter
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cat.subcategories.map((sub) => (
                    <div key={sub.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border text-xs font-medium text-foreground">
                      {sub.name}
                      <button onClick={() => onDeleteSub(sub.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface FarmsSectionProps {
  farms: { id: string; name: string }[];
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

const FarmsSection = ({ farms, onAdd, onRename, onDelete }: FarmsSectionProps) => {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nouvelle catégorie..."
          className="flex-1 px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button size="sm" className="gap-1 shrink-0" onClick={() => { if (newName.trim()) { onAdd(newName); setNewName(""); } }}>
          <Plus size={14} /> Ajouter
        </Button>
      </div>

      <div className="space-y-2">
        {farms.map((farm) => (
          <div key={farm.id} className="p-3 rounded-xl bg-card card-neon-border flex items-center justify-between">
            {editingId === farm.id ? (
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { onRename(farm.id, editName); setEditingId(null); }
                  if (e.key === "Escape") setEditingId(null);
                }}
                className="flex-1 px-2 py-1 rounded bg-secondary border border-primary text-sm text-foreground focus:outline-none mr-2"
                autoFocus
              />
            ) : (
              <span className="text-sm font-medium text-foreground">{farm.name}</span>
            )}
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingId(farm.id); setEditName(farm.name); }}>
                <Edit2 size={14} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                if (confirm(`Supprimer "${farm.name}" ?`)) onDelete(farm.id);
              }}>
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminShop;
