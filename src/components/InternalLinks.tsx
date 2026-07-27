"use client";

import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { listWikiArticles } from "@/lib/wiki-articles";

type Current = "home" | "wiki" | "news" | "daily" | "play";

const hubHrefs: { key: Current; href: string }[] = [
  { key: "home", href: "/" },
  { key: "daily", href: "/play/daily" },
  { key: "play", href: "/play" },
  { key: "news", href: "/news" },
  { key: "wiki", href: "/wiki" },
];

export function InternalLinks({
  current,
  showGuides = true,
}: {
  current?: Current;
  showGuides?: boolean;
}) {
  const { t, locale } = useI18n();
  const guides = listWikiArticles().slice(0, 4);

  return (
    <aside className="internal-links" aria-label={t.seo.explore}>
      <h2 className="internal-links-title">{t.seo.explore}</h2>
      <nav className="internal-links-hub">
        {hubHrefs
          .filter((item) => item.key !== current)
          .map((item) => (
            <Link key={item.href} href={item.href} className="internal-chip">
              {t.seo.hubs[item.key]}
            </Link>
          ))}
      </nav>
      {showGuides && (
        <>
          <p className="internal-links-label">{t.seo.guides}</p>
          <nav className="internal-links-guides">
            {guides.map((article) => (
              <Link
                key={article.slug}
                href={`/wiki/${article.slug}`}
                className="internal-guide-link"
              >
                {article.title[locale]}
              </Link>
            ))}
          </nav>
        </>
      )}
    </aside>
  );
}
