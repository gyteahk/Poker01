"use client";

import Link from "next/link";
import { InternalLinks } from "@/components/InternalLinks";
import { useI18n } from "@/components/I18nProvider";
import { wikiRanks, wikiTerms } from "@/lib/i18n";
import { listWikiArticles } from "@/lib/wiki-articles";

export default function WikiPage() {
  const { t, locale } = useI18n();
  const guides = listWikiArticles();

  return (
    <div className="page">
      <div className="shell">
        <h1 className="page-title">{t.wiki.title}</h1>
        <p className="lead">{t.wiki.subtitle}</p>

        <h2 id="guides" className="section-title" style={{ marginTop: "2.2rem" }}>
          {t.wiki.guidesTitle}
        </h2>
        <p className="muted wiki-guides-intro">{t.wiki.guidesIntro}</p>
        <div className="wiki-guide-grid">
          {guides.map((article) => (
            <Link
              key={article.slug}
              href={`/wiki/${article.slug}`}
              className="wiki-guide-card"
            >
              <h3>{article.title[locale]}</h3>
              <p className="muted">{article.teaser[locale]}</p>
              <span className="wiki-guide-cta">{t.wiki.readMore}</span>
            </Link>
          ))}
        </div>

        <h2 id="ranks" className="section-title" style={{ marginTop: "3rem" }}>
          {t.wiki.ranksTitle}
        </h2>
        <p className="muted">
          <Link href="/wiki/hand-rankings" className="inline-wiki-link">
            {t.wiki.readFullRankings}
          </Link>
        </p>
        <div className="wiki-list">
          {wikiRanks.map((rank) => (
            <article key={rank.name.en} className="wiki-item">
              <h3>{rank.name[locale]}</h3>
              <p className="muted">{rank.tip[locale]}</p>
            </article>
          ))}
        </div>

        <h2 id="terms" className="section-title" style={{ marginTop: "3rem" }}>
          {t.wiki.termsTitle}
        </h2>
        <div className="wiki-list">
          {wikiTerms.map((term) => (
            <article key={term.term.en} className="wiki-item">
              <h3>{term.term[locale]}</h3>
              <p className="muted">{term.def[locale]}</p>
            </article>
          ))}
        </div>

        <InternalLinks current="wiki" showGuides={false} />
      </div>
    </div>
  );
}
