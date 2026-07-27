"use client";

import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";

export default function PlayPage() {
  const { t } = useI18n();

  const featured = [
    {
      href: "/play/daily",
      title: t.play.dailyTitle,
      desc: t.play.dailyDesc,
      live: true,
      badges: [t.play.badgeShort, t.play.badgeThink],
    },
    {
      href: "/play/practice",
      title: t.play.practiceTitle,
      desc: t.play.practiceDesc,
      badges: [t.play.badgeMedium, t.play.badgeThink],
    },
  ];

  const games = [
    {
      href: "/play/trainer",
      title: t.play.trainerTitle,
      desc: t.play.trainerDesc,
      badges: [t.play.badgeQuick, t.play.badgeEasy],
    },
    {
      href: "/play/table",
      title: t.play.tableTitle,
      desc: t.play.tableDesc,
      badges: [t.play.badgeMedium, t.play.badgeThink],
    },
    {
      href: "/play/memory",
      title: t.play.memoryTitle,
      desc: t.play.memoryDesc,
      badges: [t.play.badgeShort, t.play.badgeEasy],
    },
    {
      href: "/play/quiz",
      title: t.play.quizTitle,
      desc: t.play.quizDesc,
      badges: [t.play.badgeQuick, t.play.badgeEasy],
    },
    {
      href: "/play/start-hand",
      title: t.play.startTitle,
      desc: t.play.startDesc,
      badges: [t.play.badgeQuick, t.play.badgeThink],
    },
  ];

  return (
    <div className="page">
      <div className="shell">
        <h1 className="page-title">{t.play.title}</h1>
        <p className="lead">{t.play.subtitle}</p>

        <div className="play-grid featured-grid">
          {featured.map((game) => (
            <Link key={game.href} href={game.href} className="play-card featured">
              {"live" in game && game.live && (
                <span className="live-badge">
                  <span className="live-dot" />
                  {t.play.live}
                </span>
              )}
              <h2>{game.title}</h2>
              <p>{game.desc}</p>
              <div className="play-badges">
                {game.badges.map((b) => (
                  <span key={b} className="play-badge">
                    {b}
                  </span>
                ))}
              </div>
              <span className="btn btn-gold btn-sm">{t.play.open}</span>
            </Link>
          ))}
        </div>

        <div className="play-grid" style={{ marginTop: "1.25rem" }}>
          {games.map((game) => (
            <Link key={game.href} href={game.href} className="play-card">
              <h2>{game.title}</h2>
              <p>{game.desc}</p>
              <div className="play-badges">
                {game.badges.map((b) => (
                  <span key={b} className="play-badge">
                    {b}
                  </span>
                ))}
              </div>
              <span className="btn btn-gold btn-sm">{t.play.open}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
