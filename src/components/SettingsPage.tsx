import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, User, Shield, Calendar, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SettingsPageProps {
  onBack: () => void;
}

const SettingsPage = ({ onBack }: SettingsPageProps) => {
  const { user } = useAuth();

  if (!user) return null;

  const initials = user.username.slice(0, 2).toUpperCase();

  const infoItems = [
    { icon: Hash, label: "Identifiant", value: user.id.slice(0, 8) + "…" },
    { icon: User, label: "Nom d'utilisateur", value: user.username },
    { icon: Shield, label: "Grade", value: user.grade || "membre" },
  ];

  return (
    <div className="px-4 py-6 pb-28 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft size={20} />
        </Button>
        <h2 className="font-display text-2xl font-bold neon-text">Paramètres</h2>
      </div>

      <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card card-neon-border mb-6">
        <Avatar className="h-20 w-20 ring-2 ring-primary/30">
          <AvatarFallback className="bg-primary/20 text-primary font-display text-xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <p className="text-foreground font-semibold text-lg">{user.username}</p>
        <span className="px-3 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wide">
          {user.grade || "membre"}
        </span>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Informations du compte
        </h3>
        {infoItems.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-center gap-4 p-4 rounded-xl bg-card card-neon-border"
          >
            <Icon className="text-primary shrink-0" size={20} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-foreground font-medium truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
