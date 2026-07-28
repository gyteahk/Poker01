"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";

export function LogoutButton() {
  const { t } = useI18n();
  return (
    <button
      type="button"
      className="secondary"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login";
      }}
    >
      {t("nav.logout")}
    </button>
  );
}
