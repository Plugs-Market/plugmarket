import { useState, useEffect } from "react";
import { ArrowLeft, Bot, Link, Unlink, RefreshCw, Send, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminTelegramWelcome from "@/components/AdminTelegramWelcome";
import AdminTelegramUsers from "@/components/AdminTelegramUsers";

interface AdminTelegramProps {
  onBack: () => void;
  isReadOnly?: boolean;
}

const AdminTelegram = ({ onBack, isReadOnly = false }: AdminTelegramProps) => {
  const [botToken, setBotToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [botInfo, setBotInfo] = useState<{ username: string; first_name: string } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showTelegramUsers, setShowTelegramUsers] = useState(false);

  const sessionToken = localStorage.getItem("plugs_market_token");

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-telegram", {
        body: { action: "get_config", session_token: sessionToken },
      });
      if (data?.config) {
        if (data.config.bot_username) {
          setBotInfo({ username: data.config.bot_username, first_name: data.config.bot_name || "" });
          setIsConnected(data.config.is_connected);
        }
        if (data.config.bot_token_masked) {
          setBotToken(data.config.bot_token_masked);
        }
      }
    } catch {
      // No config yet
    }
  };

  const handleSaveToken = async () => {
    if (!botToken.trim() || botToken.includes("•")) {
      toast.error("Entrez un token de bot valide");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-telegram", {
        body: { action: "save_token", session_token: sessionToken, bot_token: botToken.trim() },
      });
      if (error || data?.error) {
        toast.error(data?.error || "Erreur lors de la sauvegarde");
        return;
      }
      if (data?.bot_info) {
        setBotInfo(data.bot_info);
        setIsConnected(true);
        setBotToken("•".repeat(20) + botToken.slice(-4));
        toast.success(`Bot @${data.bot_info.username} connecté !`);
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleTestBot = async () => {
    setTestLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-telegram", {
        body: { action: "test_bot", session_token: sessionToken },
      });
      if (error || data?.error) {
        toast.error(data?.error || "Le bot ne répond pas");
        return;
      }
      toast.success("Le bot fonctionne correctement !");
    } catch {
      toast.error("Erreur de test");
    } finally {
      setTestLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-telegram", {
        body: { action: "disconnect", session_token: sessionToken },
      });
      if (error || data?.error) {
        toast.error(data?.error || "Erreur");
        return;
      }
      setBotInfo(null);
      setIsConnected(false);
      setBotToken("");
      toast.success("Bot déconnecté");
    } catch {
      toast.error("Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (showTelegramUsers) {
    return <AdminTelegramUsers onBack={() => setShowTelegramUsers(false)} isReadOnly={isReadOnly} />;
  }

  return (
    <div className="px-4 py-6 pb-28 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </button>
        <Bot className="text-primary" size={24} />
        <h2 className="font-display text-xl font-bold neon-text">Telegram Bot</h2>
      </div>

      {/* Status Card */}
      <Card className="mb-4 bg-card card-neon-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {isConnected ? (
              <CheckCircle size={18} className="text-green-400" />
            ) : (
              <XCircle size={18} className="text-muted-foreground" />
            )}
            Statut de connexion
          </CardTitle>
          <CardDescription>
            {isConnected && botInfo
              ? `Connecté à @${botInfo.username}`
              : "Aucun bot connecté"}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Token Config */}
      <Card className="mb-4 bg-card card-neon-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configuration du Bot</CardTitle>
          <CardDescription>
            {isReadOnly ? "Configuration actuelle du bot Telegram" : (
              <>Obtenez votre token depuis{" "}
              <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                @BotFather
              </a>{" "}
              sur Telegram</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bot-token">Token du Bot</Label>
            <Input
              id="bot-token"
              type="password"
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              className="font-mono text-xs"
              disabled={isReadOnly}
            />
          </div>
          {!isReadOnly && (
            <div className="flex gap-2">
              <Button onClick={handleSaveToken} disabled={loading || !botToken.trim()} className="flex-1">
                {loading ? <RefreshCw size={16} className="animate-spin" /> : <Link size={16} />}
                {isConnected ? "Mettre à jour" : "Connecter"}
              </Button>
              {isConnected && (
                <Button variant="destructive" onClick={handleDisconnect} disabled={loading}>
                  <Unlink size={16} />
                  Déconnecter
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {isConnected && (
        <Card className="mb-4 bg-card card-neon-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" onClick={handleTestBot} disabled={testLoading} className="w-full justify-start">
              {testLoading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
              Tester la connexion
            </Button>
            <a href={`https://t.me/${botInfo?.username}`} target="_blank" rel="noopener noreferrer" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Bot size={16} />
                Ouvrir @{botInfo?.username} sur Telegram
              </Button>
            </a>
          </CardContent>
        </Card>
      )}

      {/* Guide */}
      <Card className="mb-4 bg-card card-neon-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Guide de configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Ouvrez Telegram et cherchez <span className="text-primary">@BotFather</span></li>
            <li>Envoyez la commande <code className="text-primary">/newbot</code></li>
            <li>Suivez les instructions pour créer votre bot</li>
            <li>Copiez le token fourni et collez-le ci-dessus</li>
            <li>Cliquez sur "Connecter" pour lier le bot</li>
          </ol>
        </CardContent>
      </Card>

      {/* Welcome Message Config */}
      {isConnected && <AdminTelegramWelcome onShowTelegramUsers={() => setShowTelegramUsers(true)} isReadOnly={isReadOnly} />}
    </div>
  );
};

export default AdminTelegram;
