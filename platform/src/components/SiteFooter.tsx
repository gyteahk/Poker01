"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <strong>cyber888.vip</strong>
          <p className="muted">{t("footer.tagline")}</p>
        </div>
        <nav className="site-footer-links" aria-label="Footer">
          <Link href="/help/usdt">{t("footer.whyUsdt")}</Link>
          <Link href="/legal/terms">{t("footer.terms")}</Link>
          <Link href="/legal/privacy">{t("footer.privacy")}</Link>
          <Link href="/legal/responsible">{t("footer.responsible")}</Link>
          <Link href="/support">{t("footer.support")}</Link>
        </nav>
        <p className="site-footer-note muted-dim">{t("footer.note")}</p>
      </div>
    </footer>
  );
}
