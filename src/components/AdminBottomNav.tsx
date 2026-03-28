import { LayoutDashboard, Users, ArrowLeft, Store, Bot, HelpCircle, LucideIcon } from "lucide-react";

export type AdminTab = "dashboard" | "users" | "shop" | "telegram" | "faq";

interface AdminBottomNavProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onBack: () => void;
}

const TAB_META: Record<AdminTab, { label: string; icon: LucideIcon }> = {
  dashboard: { label: "Dashboard", icon: LayoutDashboard },
  users: { label: "Users", icon: Users },
  shop: { label: "Boutique", icon: Store },
  telegram: { label: "Telegram", icon: Bot },
  faq: { label: "FAQ", icon: HelpCircle },
};

const AdminBottomNav = ({ activeTab, onTabChange, onBack }: AdminBottomNavProps) => {
  // Dynamic right tab: show current page tab if not on dashboard, otherwise nothing
  const rightTab = activeTab !== "dashboard" ? activeTab : null;

  return (
    <nav className="fixed bottom-6 left-4 right-4 z-50">
      <div className="max-w-lg mx-auto rounded-2xl bg-card/80 backdrop-blur-xl card-neon-border neon-glow">
        <div className="flex justify-around items-center h-16">
          <button
            onClick={onBack}
            className="flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all duration-300 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={20} />
            <span className="text-[10px] font-semibold tracking-wide uppercase">Retour</span>
          </button>

          <button
            onClick={() => onTabChange("dashboard")}
            className={`flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all duration-300 ${
              activeTab === "dashboard"
                ? "text-primary neon-shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="text-[10px] font-semibold tracking-wide uppercase">Dashboard</span>
          </button>

          {rightTab && (() => {
            const { label, icon: Icon } = TAB_META[rightTab];
            return (
              <button
                onClick={() => onTabChange(rightTab)}
                className="flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all duration-300 text-primary neon-shadow"
              >
                <Icon size={20} />
                <span className="text-[10px] font-semibold tracking-wide uppercase">{label}</span>
              </button>
            );
          })()}
        </div>
      </div>
    </nav>
  );
};

export default AdminBottomNav;
