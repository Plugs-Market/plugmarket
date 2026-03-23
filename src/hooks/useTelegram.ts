export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export function useTelegram() {
  const tg = (window as any).Telegram?.WebApp;
  const user: TelegramUser | undefined = tg?.initDataUnsafe?.user;
  const isTelegram = !!tg?.initData && !!user;

  const ready = () => tg?.ready?.();
  const expand = () => tg?.expand?.();

  return { tg, user, isTelegram, ready, expand };
}
