import { Home, Star, HelpCircle, User } from "lucide-react";

type Tab = "menu" | "reviews" | "faq" | "contact";

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
    { id: "menu", label: "Home", icon: Home },
    { id: "reviews", label: "Avis", icon: Star },
    { id: "faq", label: "Infos", icon: HelpCircle },
    { id: "contact", label: "Profil", icon: User },
  ];

  return (
    <nav className="fixed bottom-6 left-4 right-4 z-50">
      <div className="max-w-lg mx-auto rounded-2xl bg-card/80 backdrop-blur-xl card-neon-border neon-glow">
        <div className="flex justify-around items-center h-16">
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

export default BottomNav;
