import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AppUser {
  id: string;
  username: string;
  grade: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  generateSeed: () => Promise<{ success: boolean; seed_phrase?: string; error?: string }>;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string, seedPhrase: string) => Promise<{ success: boolean; error?: string }>;
  recover: (
    seedPhrase: string,
    newPassword: string,
    newUsername?: string,
    telegramId?: number,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("plugs_market_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
    setLoading(false);
  }, []);

  const generateSeed = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("auth-register", {
        body: { action: "generate_seed" },
      });

      if (error || !data?.success) {
        return { success: false, error: data?.error || "Erreur lors de la génération" };
      }

      return { success: true, seed_phrase: data.seed_phrase };
    } catch {
      return { success: false, error: "Erreur lors de la génération" };
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("auth-login", {
        body: { username, password },
      });
      if (error || !data?.success) {
        return { success: false, error: data?.error || "Erreur de connexion" };
      }
      const appUser = data.user as AppUser;
      setUser(appUser);
      localStorage.setItem("plugs_market_user", JSON.stringify(appUser));
      localStorage.setItem("plugs_market_token", data.session_token);
      return { success: true };
    } catch {
      return { success: false, error: "Erreur de connexion" };
    }
  };

  const register = async (username: string, password: string, seedPhrase: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("auth-register", {
        body: { username, password, seed_phrase: seedPhrase },
      });
      if (error || !data?.success) {
        return { success: false, error: data?.error || "Erreur lors de l'inscription" };
      }
      return { success: true };
    } catch {
      return { success: false, error: "Erreur lors de l'inscription" };
    }
  };

  const recover = async (
    seedPhrase: string,
    newPassword: string,
    newUsername?: string,
    telegramId?: number,
  ) => {
    try {
      const body: Record<string, unknown> = {
        seed_phrase: seedPhrase,
        new_password: newPassword,
      };

      if (newUsername?.trim()) {
        body.new_username = newUsername.trim();
      }

      if (typeof telegramId === "number") {
        body.new_telegram_id = telegramId;
      }

      const { data, error } = await supabase.functions.invoke("auth-recover", {
        body,
      });
      if (error || !data?.success) {
        return { success: false, error: data?.error || "Erreur de récupération" };
      }
      return { success: true };
    } catch {
      return { success: false, error: "Erreur de récupération" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("plugs_market_user");
    localStorage.removeItem("plugs_market_token");
  };

  return (
    <AuthContext.Provider value={{ user, loading, generateSeed, login, register, recover, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
