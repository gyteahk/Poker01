"use client";

import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="page">
      <div className="shell status-page">
        <p className="status-code">Oops</p>
        <h1 className="page-title">{t.status.errorTitle}</h1>
        <p className="lead">{t.status.errorBody}</p>
        {error?.digest && (
          <p className="muted status-digest">#{error.digest}</p>
        )}
        <div className="cta-row">
          <button type="button" className="btn btn-gold" onClick={reset}>
            {t.status.retry}
          </button>
          <Link href="/" className="btn btn-ghost">
            {t.status.home}
          </Link>
        </div>
      </div>
    </div>
  );
}
