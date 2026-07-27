"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { dictionaries, type Dictionary, type Locale } from "@/lib/i18n";

type I18nValue = {
  locale: Locale;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
  toggle: () => void;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");

  useEffect(() => {
    const saved = window.localStorage.getItem("poker01-locale");
    if (saved === "zh" || saved === "en") setLocaleState(saved);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem("poker01-locale", next);
  }, []);

  const toggle = useCallback(() => {
    setLocale(locale === "zh" ? "en" : "zh");
  }, [locale, setLocale]);

  const value = useMemo(
    () => ({ locale, t: dictionaries[locale], setLocale, toggle }),
    [locale, setLocale, toggle],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
