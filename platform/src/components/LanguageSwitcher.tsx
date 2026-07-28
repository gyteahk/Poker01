"use client";

import { useRouter } from "next/navigation";
import { LOCALES, Locale } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const router = useRouter();

  function onPick(id: Locale) {
    setLocale(id);
    router.refresh();
  }

  return (
    <div className="lang-switch" role="group" aria-label="Language">
      {LOCALES.map((l) => (
        <button
          key={l.id}
          type="button"
          className={locale === l.id ? "active" : undefined}
          onClick={() => onPick(l.id)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
