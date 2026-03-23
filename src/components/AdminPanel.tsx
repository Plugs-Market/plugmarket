import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Trash2, UserCog, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  username: string;
  grade: string;
  telegram_id: number | null;
  created_at: string;
}

const GRADES = ["membre", "VIP", "Moderateur", "Admin"];

const AdminPanel = ({ onBack }: { onBack: () => void }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("plugs_market_token");
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "list_users", session_token: token },
      });
      if (error || !data?.success) {
        toast.error(data?.error || "Erreur lors du chargement");
        return;
      }
      setUsers(data.users);
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateGrade = async (targetId: string, newGrade: string) => {
    if (!user) return;
    try {
      const token = localStorage.getItem("plugs_market_token");
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "update_grade", session_token: token, target_user_id: targetId, new_grade: newGrade },
      });
      if (error || !data?.success) {
        toast.error(data?.error || "Erreur");
        return;
      }
      toast.success("Grade mis à jour");
      setEditingUser(null);
      fetchUsers();
    } catch {
      toast.error("Erreur de connexion");
    }
  };

  const deleteUser = async (targetId: string, username: string) => {
    if (!user) return;
    if (!confirm(`Supprimer le compte "${username}" ? Cette action est irréversible.`)) return;
    try {
      const token = localStorage.getItem("plugs_market_token");
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "delete_user", session_token: token, target_user_id: targetId },
      });
      if (error || !data?.success) {
        toast.error(data?.error || "Erreur");
        return;
      }
      toast.success("Utilisateur supprimé");
      fetchUsers();
    } catch {
      toast.error("Erreur de connexion");
    }
  };

  if (user?.grade !== "Admin") {
    return (
      <div className="px-4 py-6 pb-28 max-w-2xl mx-auto text-center">
        <p className="text-destructive font-semibold">Accès refusé</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 pb-28 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft size={20} />
        </Button>
        <div className="flex items-center gap-2">
          <Shield className="text-primary" size={22} />
          <h2 className="font-display text-xl font-bold neon-text">Panel Admin</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchUsers} className="ml-auto shrink-0">
          <RefreshCw size={18} />
        </Button>
      </div>

      <div className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20">
        <p className="text-sm text-primary font-medium">
          {users.length} utilisateur{users.length > 1 ? "s" : ""} inscrit{users.length > 1 ? "s" : ""}
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-12">Chargement...</p>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="p-4 rounded-xl bg-card card-neon-border"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">{u.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString("fr-FR")}
                    {u.telegram_id ? ` • TG: ${u.telegram_id}` : ""}
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wide shrink-0 ml-2">
                  {u.grade}
                </span>
              </div>

              {editingUser === u.id ? (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
                  {GRADES.map((g) => (
                    <Button
                      key={g}
                      size="sm"
                      variant={u.grade === g ? "default" : "outline"}
                      className="text-xs"
                      onClick={() => updateGrade(u.id, g)}
                    >
                      {g}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-muted-foreground"
                    onClick={() => setEditingUser(null)}
                  >
                    Annuler
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1.5 flex-1"
                    onClick={() => setEditingUser(u.id)}
                  >
                    <UserCog size={14} />
                    Modifier grade
                  </Button>
                  {u.id !== user?.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1.5 text-destructive hover:bg-destructive/10 border-destructive/30"
                      onClick={() => deleteUser(u.id, u.username)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
