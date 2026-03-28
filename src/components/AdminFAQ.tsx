import { useState, useEffect } from "react";
import { ArrowLeft, HelpCircle, Plus, Trash2, Edit2, Save, X, RefreshCw, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

interface AdminFAQProps {
  onBack: () => void;
  isReadOnly?: boolean;
}

const AdminFAQ = ({ onBack, isReadOnly = false }: AdminFAQProps) => {
  const [items, setItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<FAQItem | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const sessionToken = localStorage.getItem("plugs_market_token");

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-faq", {
        body: { action: "get_faq", session_token: sessionToken },
      });
      if (!error && data?.success) {
        setItems(data.items || []);
      }
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openAdd = () => {
    setEditItem(null);
    setQuestion("");
    setAnswer("");
    setShowModal(true);
  };

  const openEdit = (item: FAQItem) => {
    setEditItem(item);
    setQuestion(item.question);
    setAnswer(item.answer);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!question.trim() || !answer.trim()) return;

    try {
      if (editItem) {
        const { data, error } = await supabase.functions.invoke("admin-faq", {
          body: { action: "update_faq", session_token: sessionToken, id: editItem.id, question, answer },
        });
        if (error || !data?.success) {
          toast.error(data?.error || "Erreur");
          return;
        }
        toast.success("Question modifiée");
      } else {
        const { data, error } = await supabase.functions.invoke("admin-faq", {
          body: { action: "add_faq", session_token: sessionToken, question, answer },
        });
        if (error || !data?.success) {
          toast.error(data?.error || "Erreur");
          return;
        }
        toast.success("Question ajoutée");
      }
      setShowModal(false);
      fetchItems();
    } catch {
      toast.error("Erreur réseau");
    }
  };

  const handleDelete = async (id: string, q: string) => {
    if (!confirm(`Supprimer "${q}" ?`)) return;
    try {
      const { data, error } = await supabase.functions.invoke("admin-faq", {
        body: { action: "delete_faq", session_token: sessionToken, id },
      });
      if (error || !data?.success) {
        toast.error(data?.error || "Erreur");
        return;
      }
      toast.success("Question supprimée");
      fetchItems();
    } catch {
      toast.error("Erreur réseau");
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const newItems = [...items];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newItems.length) return;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    setItems(newItems);

    try {
      await supabase.functions.invoke("admin-faq", {
        body: { action: "reorder_faq", session_token: sessionToken, items: newItems.map((i) => i.id) },
      });
    } catch {
      toast.error("Erreur de réorganisation");
      fetchItems();
    }
  };

  return (
    <div className="px-4 py-6 pb-28 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft size={20} />
        </Button>
        <HelpCircle className="text-primary" size={24} />
        <h2 className="font-display text-xl font-bold neon-text">Infos & FAQ</h2>
        <Button variant="ghost" size="icon" onClick={fetchItems} className="ml-auto shrink-0">
          <RefreshCw size={18} />
        </Button>
      </div>

      {!isReadOnly && (
        <Button className="w-full gap-2 mb-4" onClick={openAdd}>
          <Plus size={16} /> Ajouter une question
        </Button>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isReadOnly ? "Détails" : editItem ? "Modifier la question" : "Nouvelle question"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Question</label>
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="La question..."
                autoFocus
                disabled={isReadOnly}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Réponse</label>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="La réponse..."
                rows={8}
                className="resize-none font-mono text-xs"
                disabled={isReadOnly}
              />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                BBCode : [b]gras[/b] [i]italique[/i] [u]souligné[/u] [s]barré[/s] [color=red]couleur[/color] [url=lien]texte[/url] [list][*]item[/list]
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              {isReadOnly ? "Fermer" : "Annuler"}
            </Button>
            {!isReadOnly && (
              <Button disabled={!question.trim() || !answer.trim()} onClick={handleSave}>
                <Save size={14} />
                {editItem ? "Enregistrer" : "Créer"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <p className="text-muted-foreground text-center py-12">Chargement...</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Aucune question FAQ</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={item.id} className="p-4 rounded-xl bg-card card-neon-border">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{item.question}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.answer}</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {!isReadOnly && (
                    <>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMove(index, "up")} disabled={index === 0}>
                        <ChevronUp size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMove(index, "down")} disabled={index === items.length - 1}>
                        <ChevronDown size={14} />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-1 mt-3 pt-3 border-t border-border">
                <Button variant="ghost" size="sm" className="text-xs gap-1.5 flex-1" onClick={() => openEdit(item)}>
                  <Edit2 size={12} />
                  {isReadOnly ? "Voir" : "Modifier"}
                </Button>
                {!isReadOnly && (
                  <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id, item.question)}>
                    <Trash2 size={12} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFAQ;
