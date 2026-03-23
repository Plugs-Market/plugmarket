import { useTelegram } from "@/hooks/useTelegram";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, LogIn, UserPlus, Settings, ShoppingBag, Heart, Bell } from "lucide-react";

const ProfileSection = () => {
  const { user, isTelegram } = useTelegram();

  if (!isTelegram) {
    return (
      <div className="px-4 py-6 pb-28 max-w-2xl mx-auto">
        <h2 className="font-display text-2xl font-bold neon-text mb-8">
          Mon Profil
        </h2>
        <div className="flex flex-col items-center gap-6 py-12">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <User className="text-muted-foreground" size={36} />
          </div>
          <p className="text-muted-foreground text-center text-sm">
            Connectez-vous pour accéder à votre profil
          </p>
          <div className="flex gap-3 w-full max-w-xs">
            <Button className="flex-1 gap-2" variant="default">
              <LogIn size={18} />
              Connexion
            </Button>
            <Button className="flex-1 gap-2" variant="outline">
              <UserPlus size={18} />
              Inscription
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ");
  const initials = (user.first_name?.[0] ?? "") + (user.last_name?.[0] ?? "");

  const menuItems = [
    { icon: ShoppingBag, label: "Mes commandes" },
    { icon: Heart, label: "Mes favoris" },
    { icon: Bell, label: "Notifications" },
    { icon: Settings, label: "Paramètres" },
  ];

  return (
    <div className="px-4 py-6 pb-28 max-w-2xl mx-auto">
      <h2 className="font-display text-2xl font-bold neon-text mb-6">
        Mon Profil
      </h2>

      {/* User card */}
      <div className="flex items-center gap-4 p-5 rounded-2xl bg-card card-neon-border mb-6">
        <Avatar className="h-16 w-16 ring-2 ring-primary/30">
          {user.photo_url ? (
            <AvatarImage src={user.photo_url} alt={displayName} />
          ) : null}
          <AvatarFallback className="bg-primary/20 text-primary font-display text-lg font-bold">
            {initials || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-semibold text-lg truncate">{displayName}</p>
          {user.username && (
            <p className="text-primary text-sm">@{user.username}</p>
          )}
          <p className="text-muted-foreground text-xs mt-0.5">
            ID: {user.id}
          </p>
        </div>
      </div>

      {/* Menu items */}
      <div className="space-y-2">
        {menuItems.map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-card card-neon-border hover:neon-glow transition-shadow text-left"
          >
            <Icon className="text-primary" size={20} />
            <span className="text-foreground font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfileSection;
