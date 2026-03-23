import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Users, UserCheck, Clock, TrendingUp } from "lucide-react";

interface Stats {
  totalUsers: number;
  admins: number;
  vips: number;
  moderators: number;
  members: number;
  recentSignups: number;
  telegramLinked: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("plugs_market_token");
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "get_stats", session_token: token },
      });
      if (!error && data?.success) {
        setStats(data.stats);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 pb-28 max-w-2xl mx-auto">
        <p className="text-muted-foreground text-center py-12">Chargement...</p>
      </div>
    );
  }

  const widgets = [
    { label: "Total utilisateurs", value: stats?.totalUsers ?? 0, icon: Users, color: "text-primary" },
    { label: "Admins", value: stats?.admins ?? 0, icon: Shield, color: "text-red-400" },
    { label: "VIP", value: stats?.vips ?? 0, icon: UserCheck, color: "text-yellow-400" },
    { label: "Modérateurs", value: stats?.moderators ?? 0, icon: UserCheck, color: "text-blue-400" },
    { label: "Membres", value: stats?.members ?? 0, icon: Users, color: "text-emerald-400" },
    { label: "Inscrits (7j)", value: stats?.recentSignups ?? 0, icon: TrendingUp, color: "text-purple-400" },
    { label: "Liés Telegram", value: stats?.telegramLinked ?? 0, icon: Clock, color: "text-cyan-400" },
  ];

  return (
    <div className="px-4 py-6 pb-28 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="text-primary" size={24} />
        <h2 className="font-display text-xl font-bold neon-text">Dashboard Admin</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {widgets.map((w) => (
          <div
            key={w.label}
            className="p-4 rounded-xl bg-card card-neon-border flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <w.icon size={18} className={w.color} />
              <span className="text-xs text-muted-foreground font-medium">{w.label}</span>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{w.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
