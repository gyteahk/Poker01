"use client";

import { wikiMindset, wikiRanks, wikiTerms } from "@/lib/i18n";
import { useI18n } from "@/components/I18nProvider";

export default function WikiPage() {
  const { t, locale } = useI18n();

  return (
    <div className="page">
      <div className="shell">
        <h1 className="page-title">{t.wiki.title}</h1>
        <p className="lead">{t.wiki.subtitle}</p>

        <h2 id="mindset" className="section-title" style={{ marginTop: "2.5rem" }}>
          {t.wiki.mindsetTitle}
        </h2>
        <nav className="wiki-toc" aria-label={t.wiki.toc}>
          {wikiMindset.map((item) => (
            <a key={item.id} href={`#${item.id}`} className="wiki-toc-link">
              {item.title[locale]}
            </a>
          ))}
        </nav>
        <div className="wiki-list mindset-list">
          {wikiMindset.map((item) => (
            <article key={item.id} id={item.id} className="wiki-item mindset-item">
              <h3>{item.title[locale]}</h3>
              <p className="muted">{item.body[locale]}</p>
            </article>
          ))}
        </div>

        <h2 id="ranks" className="section-title" style={{ marginTop: "3rem" }}>
          {t.wiki.ranksTitle}
        </h2>
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
      </div>
    </div>
  );
}
