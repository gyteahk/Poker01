"use client";

import Link from "next/link";
import { InternalLinks } from "@/components/InternalLinks";
import { CONTACT } from "@/lib/i18n";
import { useI18n } from "@/components/I18nProvider";
import { listWikiArticles } from "@/lib/wiki-articles";

export default function HomePage() {
  const { t, locale } = useI18n();
  const featuredGuides = listWikiArticles().slice(0, 3);

  return (
    <>
      <section className="hero">
        <div className="hero-media" aria-hidden />
        <div className="shell hero-content">
          <h1 className="brand-hero">{t.hero.brand}</h1>
          <h2>{t.hero.headline}</h2>
          <p className="hero-sub">{t.hero.sub}</p>
          <div className="cta-row">
            <a
              href={CONTACT.clubJoinLink}
              className="btn btn-gold"
              target="_blank"
              rel="noreferrer"
            >
              {t.hero.ctaClub}
            </a>
            <Link href="/play/daily" className="btn btn-ghost">
              {t.home.entryDaily}
            </Link>
            <a
              href={CONTACT.whatsappLink}
              className="btn btn-ghost"
              target="_blank"
              rel="noreferrer"
            >
              {t.hero.ctaJoin}
            </a>
          </div>
        </div>
      </section>

      <section className="section intro-section">
        <div className="shell">
          <p className="site-intro">{t.home.intro}</p>
        </div>
      </section>

      <section className="section essay-section" aria-labelledby="essay-title">
        <div className="shell essay-shell">
          <header className="essay-header">
            <h2 id="essay-title" className="essay-title">
              {t.home.essayTitle}
            </h2>
            <p className="essay-lead">{t.home.essayLead}</p>
          </header>

          <article className="essay-article">
            <h3>{t.home.essayWhatTitle}</h3>
            <p>
              {t.home.essayWhat}{" "}
              <Link href="/wiki/texas-holdem-rules" className="inline-wiki-link">
                {t.seo.hubs.wiki}
              </Link>
            </p>

            <h3>{t.home.essayRulesTitle}</h3>
            <p>{t.home.essayRules}</p>

            <h3>{t.home.essayMindTitle}</h3>
            <p>
              {t.home.essayMind}{" "}
              <Link href="/wiki/tilt" className="inline-wiki-link">
                Tilt
              </Link>
            </p>

            <h3>{t.home.essayWinrateTitle}</h3>
            <p>
              {t.home.essayWinrate}{" "}
              <Link href="/wiki/pot-odds" className="inline-wiki-link">
                {locale === "zh" ? "底池賠率" : "Pot odds"}
              </Link>
            </p>

            <h3>{t.home.essayTimeTitle}</h3>
            <p>{t.home.essayTime}</p>

            <h3>{t.home.essayWhyTitle}</h3>
            <p>{t.home.essayWhy}</p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="entry-grid">
            <Link href="/play/daily" className="entry-card">
              <span className="live-badge">
                <span className="live-dot" />
                Live
              </span>
              <h3>{t.home.entryDaily}</h3>
              <p>{t.home.entryDailyDesc}</p>
            </Link>
            <Link href="/play" className="entry-card">
              <h3>{t.home.entryPlay}</h3>
              <p>{t.home.entryPlayDesc}</p>
            </Link>
            <Link href="/news" className="entry-card">
              <h3>{t.home.entryNews}</h3>
              <p>{t.home.entryNewsDesc}</p>
            </Link>
            <Link href="/wiki" className="entry-card">
              <h3>{t.home.wikiTitle}</h3>
              <p>{t.home.wikiBody}</p>
            </Link>
          </div>

          <div className="why-banner">
            <h3 className="why-id">{t.home.whyTitle}</h3>
            <p>{t.home.whyBody}</p>
            <a
              href={CONTACT.clubJoinLink}
              className="btn btn-gold btn-sm why-cta"
              target="_blank"
              rel="noreferrer"
            >
              {t.home.whyCta}
            </a>
          </div>

          <h2 className="section-title" style={{ marginTop: "2.5rem" }}>
            {t.wiki.guidesTitle}
          </h2>
          <div className="wiki-guide-grid">
            {featuredGuides.map((article) => (
              <Link
                key={article.slug}
                href={`/wiki/${article.slug}`}
                className="wiki-guide-card"
              >
                <h3>{article.title[locale]}</h3>
                <p className="muted">{article.teaser[locale]}</p>
              </Link>
            ))}
          </div>

          <div className="feature-grid">
            <article className="feature">
              <h3>{t.home.gamesTitle}</h3>
              <p>{t.home.gamesBody}</p>
            </article>
            <article className="feature">
              <h3>{t.home.newsTitle}</h3>
              <p>{t.home.newsBody}</p>
            </article>
            <article className="feature">
              <h3>{t.home.wikiTitle}</h3>
              <p>{t.home.wikiBody}</p>
            </article>
          </div>

          <InternalLinks current="home" />
        </div>
      </section>
    </>
  );
}
