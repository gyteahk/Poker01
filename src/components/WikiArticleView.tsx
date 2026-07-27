"use client";

import Link from "next/link";
import { InternalLinks } from "@/components/InternalLinks";
import { useI18n } from "@/components/I18nProvider";
import {
  getWikiArticle,
  type WikiArticle,
} from "@/lib/wiki-articles";

export function WikiArticleView({ article }: { article: WikiArticle }) {
  const { t, locale } = useI18n();
  const related = article.related
    .map((slug) => getWikiArticle(slug))
    .filter(Boolean) as WikiArticle[];

  return (
    <div className="page">
      <div className="shell wiki-article-shell">
        <Link href="/wiki" className="news-back">
          ← {t.wiki.back}
        </Link>

        <article className="wiki-article">
          <p className="date-tag">{article.updatedAt}</p>
          <h1 className="page-title">{article.title[locale]}</h1>
          <p className="lead">{article.description[locale]}</p>

          {article.sections.map((section) => (
            <section key={section.heading.en} className="wiki-article-section">
              <h2>{section.heading[locale]}</h2>
              {section.paragraphs.map((p, i) => (
                <p key={i}>{p[locale]}</p>
              ))}
            </section>
          ))}
        </article>

        {related.length > 0 && (
          <section className="wiki-related" aria-labelledby="wiki-related-title">
            <h2 id="wiki-related-title" className="section-title">
              {t.wiki.related}
            </h2>
            <div className="wiki-guide-grid">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/wiki/${item.slug}`}
                  className="wiki-guide-card"
                >
                  <h3>{item.title[locale]}</h3>
                  <p className="muted">{item.teaser[locale]}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <InternalLinks current="wiki" />
      </div>
    </div>
  );
}
