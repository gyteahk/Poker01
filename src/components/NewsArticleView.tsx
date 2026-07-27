"use client";

import Link from "next/link";
import type { NewsArticle } from "@/lib/news-shared";
import { InternalLinks } from "@/components/InternalLinks";
import { useI18n } from "@/components/I18nProvider";

export function NewsArticleView({ article }: { article: NewsArticle }) {
  const { t, locale } = useI18n();

  return (
    <div className="page">
      <div className="shell news-detail">
        <Link href="/news" className="news-back">
          ← {t.news.back}
        </Link>

        <article className="news-detail-article">
          <div className="news-detail-media">
            {article.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.imageUrl}
                alt=""
                className="news-cover news-cover-lg"
              />
            ) : (
              <div className="news-cover news-cover-lg news-cover-fallback" />
            )}
          </div>
          <time className="date-tag" dateTime={article.date}>
            {article.date}
          </time>
          <h1 className="page-title news-detail-title">
            {article.title[locale]}
          </h1>
          <p className="news-byline">{t.news.byline}</p>
          <div className="news-detail-body">
            {article.body[locale]
              .split(/\n+/)
              .filter(Boolean)
              .map((para, i) => (
                <p key={i}>{para}</p>
              ))}
          </div>
          {article.source && (
            <p className="date-tag">
              {t.news.source}: {article.source}
            </p>
          )}
        </article>

        <InternalLinks current="news" />
      </div>
    </div>
  );
}
