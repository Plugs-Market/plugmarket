import { LayoutDashboard, Users, ArrowLeft } from "lucide-react";

export type AdminTab = "dashboard" | "users" | "shop";

interface AdminBottomNavProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onBack: () => void;
}

const AdminBottomNav = ({ activeTab, onTabChange, onBack }: AdminBottomNavProps) => {
  const tabs: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
  ];

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
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all duration-300 ${
                activeTab === id
                  ? "text-primary neon-shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-semibold tracking-wide uppercase">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default AdminBottomNav;
