import { Shield, Users, Store, Bot } from "lucide-react";

interface AdminDashboardProps {
  onNavigate?: (tab: string) => void;
}

const AdminDashboard = ({ onNavigate }: AdminDashboardProps) => {
  return (
    <div className="px-4 py-6 pb-28 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="text-primary" size={24} />
        <h2 className="font-display text-xl font-bold neon-text">Dashboard Admin</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate?.("users")}
          className="p-5 rounded-xl bg-card card-neon-border flex flex-col gap-3 text-left hover:neon-glow transition-shadow"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Users size={20} className="text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Utilisateurs</span>
          <span className="text-xs text-muted-foreground">Gérer les comptes inscrits</span>
        </button>

        <button
          onClick={() => onNavigate?.("shop")}
          className="p-5 rounded-xl bg-card card-neon-border flex flex-col gap-3 text-left hover:neon-glow transition-shadow"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Store size={20} className="text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Boutique</span>
          <span className="text-xs text-muted-foreground">Produits, menus & catégories</span>
        </button>

        <button
          onClick={() => onNavigate?.("telegram")}
          className="p-5 rounded-xl bg-card card-neon-border flex flex-col gap-3 text-left hover:neon-glow transition-shadow"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Bot size={20} className="text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Telegram</span>
          <span className="text-xs text-muted-foreground">Configurer le bot Telegram</span>
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
