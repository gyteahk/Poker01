"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { Locale, LOCALE_COOKIE, translate } from "@/lib/i18n/dictionaries";

type I18nCtx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const Ctx = createContext<I18nCtx | null>(null);

function writeCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(locale)};path=/;max-age=31536000;samesite=lax`;
}

export function I18nProvider({
  children,
  initialLocale = "zh-Hant",
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const value = useMemo<I18nCtx>(
    () => ({
      locale,
      setLocale: (l) => {
        setLocaleState(l);
        writeCookie(l);
        if (typeof document !== "undefined") {
          document.documentElement.lang = l === "en" ? "en" : l;
        }
      },
      t: (key, vars) => translate(locale, key, vars),
    }),
    [locale],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n outside provider");
  return ctx;
}
