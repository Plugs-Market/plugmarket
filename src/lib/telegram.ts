export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

let scriptLoaded = false;
let scriptPromise: Promise<void> | null = null;

function loadTelegramScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    // If already available (e.g. loaded externally)
    if ((window as any).Telegram?.WebApp) {
      scriptLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = () => {
      scriptLoaded = true; // mark done even on error
      resolve();
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function getTelegramUser(): { user: TelegramUser | undefined; isTelegram: boolean } {
  const tg = (window as any).Telegram?.WebApp;
  const user: TelegramUser | undefined = tg?.initDataUnsafe?.user;
  const isTelegram = !!tg?.initData && !!user;
  return { user, isTelegram };
}

export function telegramReady() {
  (window as any).Telegram?.WebApp?.ready?.();
}

export function telegramExpand() {
  (window as any).Telegram?.WebApp?.expand?.();
}

export { loadTelegramScript };
