"use client";

import Link from "next/link";
import { CONTACT } from "@/lib/i18n";
import { useI18n } from "@/components/I18nProvider";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="page">
      <div className="shell status-page">
        <p className="status-code">404</p>
        <h1 className="page-title">{t.status.notFoundTitle}</h1>
        <p className="lead">{t.status.notFoundBody}</p>
        <div className="cta-row">
          <Link href="/" className="btn btn-gold">
            {t.status.home}
          </Link>
          <Link href="/play" className="btn btn-ghost">
            {t.nav.play}
          </Link>
          <a
            href={CONTACT.clubJoinLink}
            className="btn btn-ghost"
            target="_blank"
            rel="noreferrer"
          >
            {t.nav.join}
          </a>
        </div>
      </div>
    </div>
  );
}
