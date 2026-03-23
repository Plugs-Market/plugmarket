import { useState } from "react";
import { useTelegram } from "@/hooks/useTelegram";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, LogIn, UserPlus, Settings, ShoppingBag, Heart, Bell, LogOut } from "lucide-react";
import AuthModal from "@/components/AuthModal";

const ProfileSection = () => {
  const { user: tgUser, isTelegram, loading: tgLoading } = useTelegram();
  const { user: appUser, loading: authLoading, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<"login" | "register">("login");

  const loading = tgLoading || authLoading;

  if (loading) {
    return (
      <div className="px-4 py-6 pb-28 max-w-2xl mx-auto">
        <h2 className="font-display text-2xl font-bold neon-text mb-8">Mon Profil</h2>
        <p className="text-muted-foreground text-center py-12">Chargement...</p>
      </div>
    );
  }

  const isLoggedIn = isTelegram || !!appUser;

  if (!isLoggedIn) {
    return (
      <div className="px-4 py-6 pb-28 max-w-2xl mx-auto">
        <h2 className="font-display text-2xl font-bold neon-text mb-8">Mon Profil</h2>
        <div className="flex flex-col items-center gap-6 py-12">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <User className="text-muted-foreground" size={36} />
          </div>
          <p className="text-muted-foreground text-center text-sm">
            Connectez-vous pour accéder à votre profil
          </p>
          <div className="flex gap-3 w-full max-w-xs">
            <Button
              className="flex-1 gap-2"
              variant="default"
              onClick={() => { setAuthView("login"); setAuthOpen(true); }}
            >
              <LogIn size={18} />
              Connexion
            </Button>
            <Button
              className="flex-1 gap-2"
              variant="outline"
              onClick={() => { setAuthView("register"); setAuthOpen(true); }}
            >
              <UserPlus size={18} />
              Inscription
            </Button>
          </div>
        </div>
        <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultView={authView} />
      </div>
    );
  }

  // Display name logic
  const displayName = isTelegram
    ? [tgUser!.first_name, tgUser!.last_name].filter(Boolean).join(" ")
    : appUser!.username;
  const initials = isTelegram
    ? (tgUser!.first_name?.[0] ?? "") + (tgUser!.last_name?.[0] ?? "")
    : appUser!.username.slice(0, 2).toUpperCase();
  const subtitle = isTelegram && tgUser!.username ? `@${tgUser!.username}` : null;
  const userId = isTelegram ? `ID: ${tgUser!.id}` : null;
  const photoUrl = isTelegram ? tgUser!.photo_url : undefined;

  const menuItems = [
    { icon: ShoppingBag, label: "Mes commandes" },
    { icon: Heart, label: "Mes favoris" },
    { icon: Bell, label: "Notifications" },
    { icon: Settings, label: "Paramètres" },
  ];

  return (
    <div className="px-4 py-6 pb-28 max-w-2xl mx-auto">
      <h2 className="font-display text-2xl font-bold neon-text mb-6">Mon Profil</h2>
      <div className="flex items-center gap-4 p-5 rounded-2xl bg-card card-neon-border mb-6">
        <Avatar className="h-16 w-16 ring-2 ring-primary/30">
          {photoUrl ? <AvatarImage src={photoUrl} alt={displayName} /> : null}
          <AvatarFallback className="bg-primary/20 text-primary font-display text-lg font-bold">
            {initials || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-semibold text-lg truncate">{displayName}</p>
          {subtitle && <p className="text-primary text-sm">{subtitle}</p>}
          {userId && <p className="text-muted-foreground text-xs mt-0.5">{userId}</p>}
        </div>
      </div>
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
        {!isTelegram && (
          <button
            onClick={logout}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-card card-neon-border hover:border-destructive/50 transition-all text-left"
          >
            <LogOut className="text-destructive" size={20} />
            <span className="text-destructive font-medium">Déconnexion</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileSection;
