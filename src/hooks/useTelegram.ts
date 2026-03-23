import { useState, useEffect } from "react";
import { getTelegramUser, loadTelegramScript, telegramReady, telegramExpand, type TelegramUser } from "@/lib/telegram";

export function useTelegram() {
  const [user, setUser] = useState<TelegramUser | undefined>(undefined);
  const [isTelegram, setIsTelegram] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTelegramScript().then(() => {
      const result = getTelegramUser();
      setUser(result.user);
      setIsTelegram(result.isTelegram);
      if (result.isTelegram) {
        telegramReady();
        telegramExpand();
      }
      setLoading(false);
    });
  }, []);

  return { user, isTelegram, loading };
}
