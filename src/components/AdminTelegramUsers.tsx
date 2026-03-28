import { useState, useEffect } from "react";
import { ArrowLeft, Users, RefreshCw, Search, MessageSquare, Ban, ShieldCheck, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
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
  is_banned: boolean;
  ban_reason: string | null;
  ban_until: string | null;
  banned_at: string | null;
}

interface AdminTelegramUsersProps {
  onBack: () => void;
  isReadOnly?: boolean;
}

const BAN_DURATIONS = [
  { value: "1", label: "1 heure" },
  { value: "6", label: "6 heures" },
  { value: "24", label: "1 jour" },
  { value: "72", label: "3 jours" },
  { value: "168", label: "1 semaine" },
  { value: "720", label: "1 mois" },
  { value: "permanent", label: "Permanent" },
];

const AdminTelegramUsers = ({ onBack, isReadOnly = false }: AdminTelegramUsersProps) => {
  const [users, setUsers] = useState<TelegramUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [banningUser, setBanningUser] = useState<TelegramUser | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("24");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

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

  const handleBan = async () => {
    if (!banningUser) return;
    setActionLoading(banningUser.chat_id);
    try {
      const { data, error } = await supabase.functions.invoke("admin-telegram", {
        body: {
          action: "ban_telegram_user",
          session_token: sessionToken,
          chat_id: banningUser.chat_id,
          reason: banReason || null,
          duration_hours: banDuration === "permanent" ? null : parseInt(banDuration),
        },
      });
      if (error || !data?.success) {
        toast.error(data?.error || "Erreur");
        return;
      }
      toast.success(`${banningUser.first_name || banningUser.username || "Utilisateur"} banni`);
      setBanningUser(null);
      setBanReason("");
      setBanDuration("24");
      fetchUsers();
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnban = async (u: TelegramUser) => {
    setActionLoading(u.chat_id);
    try {
      const { data, error } = await supabase.functions.invoke("admin-telegram", {
        body: {
          action: "unban_telegram_user",
          session_token: sessionToken,
          chat_id: u.chat_id,
        },
      });
      if (error || !data?.success) {
        toast.error(data?.error || "Erreur");
        return;
      }
      toast.success(`${u.first_name || u.username || "Utilisateur"} débanni`);
      fetchUsers();
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setActionLoading(null);
    }
  };

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
          {" • "}
          <span className="text-destructive">{filtered.filter((u) => u.is_banned).length} banni{filtered.filter((u) => u.is_banned).length > 1 ? "s" : ""}</span>
        </p>
      </div>

      {/* Ban Modal */}
      {banningUser && (
        <Card className="mb-4 bg-card card-neon-border border-destructive/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm text-destructive flex items-center gap-2">
                <Ban size={16} />
                Bannir {banningUser.first_name || banningUser.username || `Chat ${banningUser.chat_id}`}
              </p>
              <button onClick={() => setBanningUser(null)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Raison du ban</Label>
              <Textarea
                placeholder="Spam, comportement abusif..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="text-xs min-h-[60px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Durée</Label>
              <Select value={banDuration} onValueChange={setBanDuration}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BAN_DURATIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={handleBan}
              disabled={actionLoading === banningUser.chat_id}
            >
              {actionLoading === banningUser.chat_id ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Ban size={14} />
              )}
              Confirmer le ban
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground text-center py-12">Chargement...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Aucun utilisateur Telegram trouvé</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((u) => (
            <Card key={u.id} className={`bg-card card-neon-border ${u.is_banned ? "border-destructive/30 opacity-80" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate flex items-center gap-2">
                      {u.first_name || ""}
                      {u.last_name ? ` ${u.last_name}` : ""}
                      {!u.first_name && !u.last_name ? `Chat ${u.chat_id}` : ""}
                      {u.is_banned && (
                        <span className="px-1.5 py-0.5 rounded bg-destructive/20 text-destructive text-[10px] font-bold uppercase">
                          Banni
                        </span>
                      )}
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

                {/* Ban info */}
                {u.is_banned && (
                  <div className="mb-3 p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs space-y-1">
                    {u.ban_reason && (
                      <p className="text-foreground">
                        <span className="text-muted-foreground">Raison : </span>{u.ban_reason}
                      </p>
                    )}
                    <p className="text-foreground flex items-center gap-1">
                      <Clock size={10} className="text-muted-foreground" />
                      <span className="text-muted-foreground">Jusqu'au : </span>
                      {u.ban_until ? formatDate(u.ban_until) : "Permanent"}
                    </p>
                  </div>
                )}

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

                {/* Ban/Unban actions */}
                {!isReadOnly && (
                  <div className="mt-3 pt-3 border-t border-border">
                    {u.is_banned ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs gap-1.5"
                        onClick={() => handleUnban(u)}
                        disabled={actionLoading === u.chat_id}
                      >
                        {actionLoading === u.chat_id ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <ShieldCheck size={14} />
                        )}
                        Débannir
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs gap-1.5 text-destructive hover:bg-destructive/10 border-destructive/30"
                        onClick={() => {
                          setBanningUser(u);
                          setBanReason("");
                          setBanDuration("24");
                        }}
                      >
                        <Ban size={14} />
                        Bannir
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTelegramUsers;
