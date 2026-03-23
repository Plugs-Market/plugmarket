import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, LogIn, UserPlus, Settings, ShoppingBag, Heart, Bell, LogOut, Shield } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import AdminPanel from "@/components/AdminPanel";

const ProfileSection = () => {
  const { user: appUser, loading: authLoading, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [showAdmin, setShowAdmin] = useState(false);

  if (showAdmin && appUser?.grade === "Admin") {
    return <AdminPanel onBack={() => setShowAdmin(false)} />;
  }

  if (authLoading) {
    return (
      <div className="px-4 py-6 pb-28 max-w-2xl mx-auto">
        <h2 className="font-display text-2xl font-bold neon-text mb-8">Mon Profil</h2>
        <p className="text-muted-foreground text-center py-12">Chargement...</p>
      </div>
    );
  }

  if (!appUser) {
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

  const displayName = appUser.username;
  const initials = appUser.username.slice(0, 2).toUpperCase();

  const menuItems = [
    { icon: ShoppingBag, label: "Mes commandes" },
    { icon: Heart, label: "Mes favoris" },
    { icon: Bell, label: "Notifications" },
    { icon: Settings, label: "Paramètres" },
  ];

  const isAdmin = appUser.grade === "Admin";

  return (
    <div className="px-4 py-6 pb-28 max-w-2xl mx-auto">
      <h2 className="font-display text-2xl font-bold neon-text mb-6">Mon Profil</h2>
      <div className="flex items-center gap-4 p-5 rounded-2xl bg-card card-neon-border mb-6">
        <Avatar className="h-16 w-16 ring-2 ring-primary/30">
          <AvatarFallback className="bg-primary/20 text-primary font-display text-lg font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-semibold text-lg truncate">{displayName}</p>
          <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wide">
            {appUser.grade || "membre"}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {isAdmin && (
          <button
            onClick={() => setShowAdmin(true)}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-primary/10 card-neon-border hover:neon-glow transition-shadow text-left border-primary/30"
          >
            <Shield className="text-primary" size={20} />
            <span className="text-primary font-semibold">Panel Admin</span>
          </button>
        )}
        {menuItems.map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-card card-neon-border hover:neon-glow transition-shadow text-left"
          >
            <Icon className="text-primary" size={20} />
            <span className="text-foreground font-medium">{label}</span>
          </button>
        ))}
        <button
          onClick={logout}
          className="w-full flex items-center gap-4 p-4 rounded-xl bg-card card-neon-border hover:border-destructive/50 transition-all text-left"
        >
          <LogOut className="text-destructive" size={20} />
          <span className="text-destructive font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileSection;
