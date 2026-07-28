"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { gameCategoryImage, CATEGORY_IMAGES } from "@/lib/categories";
import { useI18n } from "@/lib/i18n/I18nProvider";

type Game = {
  id: string;
  name: string;
  category: string;
  provider: string;
  externalId: string;
  imageUrl?: string | null;
};

const CAT_KEYS = ["slots", "fishing", "cards", "poker"] as const;

export default function GamesPage() {
  return (
    <Suspense fallback={<div className="app-body muted">…</div>}>
      <GamesPageInner />
    </Suspense>
  );
}

function GamesPageInner() {
  const { t } = useI18n();
  const search = useSearchParams();
  const initialCat = search.get("cat") || "all";
  const [games, setGames] = useState<Game[]>([]);
  const [cat, setCat] = useState(initialCat);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const next = search.get("cat") || "all";
    setCat(next);
  }, [search]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/games");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      setGames(data.games || []);
      setBooting(false);
    })();
  }, []);

  const catLabel = (c: string) => t(`games.cat.${c}` as "games.cat.slots") || c;

  const filtered = useMemo(() => {
    return games.filter((g) => {
      if (cat === "poker") {
        // 真人發牌歸入撲克，避免同「真人」分類重疊
        if (g.category !== "poker" && g.category !== "live") return false;
      } else if (cat !== "all" && g.category !== cat) {
        return false;
      }
      if (q && !g.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [games, cat, q]);

  const listCategoryLabel = (c: string) => {
    if (c === "live") return t("games.cat.poker");
    return catLabel(c);
  };

  async function launch(gameId: string) {
    setErr("");
    setMsg("");
    setLoadingId(gameId);
    const res = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId }),
    });
    const data = await res.json();
    setLoadingId(null);
    if (!res.ok) {
      setErr(data.error || "Launch failed");
      return;
    }
    setMsg(t("games.launched", { name: data.game.name }));
    if (data.launchUrl) {
      window.location.href = data.launchUrl;
    }
  }

  return (
    <div className="app-body">
      <div className="stack" style={{ gap: "0.75rem" }}>
        <section className="page-title-bar">
          <h1>{t("games.title")}</h1>
          <p className="muted">{t("games.lead")}</p>
        </section>

        <section>
          <h2 className="cat-section-title">{t("games.categories")}</h2>
          <div className="category-grid">
            <button
              type="button"
              className={`category-tile ${cat === "all" ? "active" : ""}`}
              onClick={() => setCat("all")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={CATEGORY_IMAGES.games} alt="" />
              <span>{t("games.all")}</span>
            </button>
            {CAT_KEYS.map((c) => (
              <button
                key={c}
                type="button"
                className={`category-tile ${cat === c ? "active" : ""}`}
                onClick={() => setCat(c)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={gameCategoryImage(c)} alt="" />
                <span>{catLabel(c)}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="row" style={{ justifyContent: "flex-end" }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("games.search")}
            style={{ minWidth: 160 }}
          />
        </div>

        {err ? <div className="alert error">{err}</div> : null}
        {msg ? <div className="alert ok">{msg}</div> : null}

        <div className="game-list">
          {booting ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton skeleton-row" />
            ))
          ) : filtered.length ? (
            filtered.map((g) => (
              <button
                key={g.id}
                type="button"
                className="game-list-row"
                disabled={loadingId === g.id}
                onClick={() => launch(g.id)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={g.category === "live" ? gameCategoryImage("poker") : gameCategoryImage(g.category)}
                  alt=""
                  className="game-list-thumb"
                />
                <span className="game-list-meta">
                  <strong>{g.name}</strong>
                    <span className="muted">
                      {listCategoryLabel(g.category)} · {t("games.demo")}
                    </span>
                </span>
                <span className="game-list-cta">
                  {loadingId === g.id ? t("games.launching") : "→"}
                </span>
              </button>
            ))
          ) : (
            <div className="card muted">{t("games.empty")}</div>
          )}
        </div>
      </div>
    </div>
  );
}
