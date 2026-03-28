import { useState, useEffect } from "react";
import { ArrowLeft, Users, RefreshCw, Search, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TelegramUser {
  id: string;
  chat_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  language_code: string | null;
  first_seen_at: string;
  last_seen_at: string;
  message_count: number;
}

interface AdminTelegramUsersProps {
  onBack: () => void;
}

const AdminTelegramUsers = ({ onBack }: AdminTelegramUsersProps) => {
  const [users, setUsers] = useState<TelegramUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const sessionToken = localStorage.getItem("plugs_market_token");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-telegram", {
        body: { action: "list_telegram_users", session_token: sessionToken },
      });
      if (error || !data?.success) {
        toast.error(data?.error || "Erreur lors du chargement");
        return;
      }
      setUsers(data.users || []);
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.username || "").toLowerCase().includes(q) ||
      (u.first_name || "").toLowerCase().includes(q) ||
      (u.last_name || "").toLowerCase().includes(q) ||
      String(u.chat_id).includes(q)
    );
  });

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="px-4 py-6 pb-28 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </button>
        <Users className="text-primary" size={24} />
        <h2 className="font-display text-xl font-bold neon-text">Utilisateurs Telegram</h2>
        <Button variant="ghost" size="icon" onClick={fetchUsers} className="ml-auto shrink-0">
          <RefreshCw size={18} />
        </Button>
      </div>

      <div className="mb-4 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher par nom, username ou ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20">
        <p className="text-sm text-primary font-medium">
          {filtered.length} utilisateur{filtered.length > 1 ? "s" : ""} Telegram
          {search && ` trouvé${filtered.length > 1 ? "s" : ""}`}
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-12">Chargement...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Aucun utilisateur Telegram trouvé</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => (
            <Card key={u.id} className="bg-card card-neon-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">
                      {u.first_name || ""}
                      {u.last_name ? ` ${u.last_name}` : ""}
                      {!u.first_name && !u.last_name ? `Chat ${u.chat_id}` : ""}
                    </p>
                    {u.username && (
                      <p className="text-xs text-primary font-mono">@{u.username}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <MessageSquare size={12} className="text-muted-foreground" />
                    <span className="text-xs font-bold text-muted-foreground">{u.message_count}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider opacity-60">ID</span>
                    <span className="font-mono">{u.chat_id}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider opacity-60">Langue</span>
                    <span>{u.language_code || "—"}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider opacity-60">Premier message</span>
                    <span>{formatDate(u.first_seen_at)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider opacity-60">Dernier message</span>
                    <span>{formatDate(u.last_seen_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTelegramUsers;
