"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { newsExcerpt, type NewsArticle } from "@/lib/news-shared";

/** Client-side quiet refresh while the news page stays open (matches server interval). */
const CLIENT_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

export default function NewsPage() {
  const { t, locale } = useI18n();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async (opts?: { check?: boolean; quiet?: boolean }) => {
    const checkUpdates = opts?.check ?? false;
    const quiet = opts?.quiet ?? false;
    if (checkUpdates && !quiet) setChecking(true);
    else if (!checkUpdates) setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/news${checkUpdates ? "?check=1" : ""}`);
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      setArticles(data.articles ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      void load({ check: true, quiet: true });
    }, CLIENT_CHECK_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  return (
    <div className="page">
      <div className="shell">
        <h1 className="page-title">{t.news.title}</h1>
        <p className="lead">{t.news.subtitle}</p>

        <div className="news-toolbar">
          <button
            type="button"
            className="btn btn-gold btn-sm"
            onClick={() => void load({ check: true })}
            disabled={loading || checking}
          >
            {checking ? t.news.checking : t.news.refresh}
          </button>
        </div>

        {error && <p className="result-msg bad">{t.news.error}</p>}

        {loading && (
          <div className="news-list">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="news-card skeleton-card" aria-hidden>
                <div className="skeleton skeleton-media" />
                <div className="news-card-body">
                  <div className="skeleton skeleton-line short" />
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-line" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && (
          <div className="news-list">
            {articles.map((item) => (
              <Link
                key={item.id}
                href={`/news/${encodeURIComponent(item.id)}`}
                className="news-card"
              >
                <div className="news-card-media">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="news-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="news-cover news-cover-fallback" />
                  )}
                </div>
                <div className="news-card-body">
                  <time className="date-tag" dateTime={item.date}>
                    {item.date}
                  </time>
                  <h2>{item.title[locale]}</h2>
                  <p className="muted news-excerpt">
                    {newsExcerpt(item.body[locale])}
                  </p>
                  <p className="news-byline">{t.news.byline}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
