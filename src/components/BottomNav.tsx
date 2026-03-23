import { Home, HelpCircle, Mail } from "lucide-react";

type Tab = "menu" | "faq" | "contact";

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
    { id: "menu", label: "Menu", icon: Home },
    { id: "faq", label: "FAQ", icon: HelpCircle },
    { id: "contact", label: "Contact", icon: Mail },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
              activeTab === id ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon size={20} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
