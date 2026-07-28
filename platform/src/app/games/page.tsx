"use client";

import { useEffect, useMemo, useState } from "react";

type Game = {
  id: string;
  name: string;
  category: string;
  provider: string;
  externalId: string;
  imageUrl?: string | null;
};

const CATEGORY_LABEL: Record<string, string> = {
  slots: "老虎機",
  live: "真人",
  fishing: "打魚",
  cards: "發牌",
  poker: "撲克",
  other: "其他",
};

function coverSrc(g: Game) {
  if (g.imageUrl) return g.imageUrl;
  if (g.externalId) return `/games/covers/${g.externalId}.png`;
  return null;
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [broken, setBroken] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/games");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      setGames(data.games || []);
    })();
  }, []);

  const categories = useMemo(() => [...new Set(games.map((g) => g.category))], [games]);

  const filtered = useMemo(() => {
    return games.filter((g) => {
      if (cat !== "all" && g.category !== cat) return false;
      if (q && !g.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [games, cat, q]);

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
    setMsg(`已啟動 ${data.game.name}`);
    if (data.launchUrl) {
      window.location.href = data.launchUrl;
    }
  }

  return (
    <div className="app-body">
      <div className="stack" style={{ gap: "0.75rem" }}>
        <section className="page-title-bar">
          <h1>遊戲大廳</h1>
          <p className="muted">點封面圖進入遊戲</p>
        </section>

        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="row" style={{ flexWrap: "wrap" }}>
            <button
              type="button"
              className={cat === "all" ? undefined : "secondary"}
              onClick={() => setCat("all")}
            >
              全部
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                className={cat === c ? undefined : "secondary"}
                onClick={() => setCat(c)}
              >
                {CATEGORY_LABEL[c] || c}
              </button>
            ))}
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜尋遊戲"
            style={{ minWidth: 160 }}
          />
        </div>

        {err ? <div className="alert error">{err}</div> : null}
        {msg ? <div className="alert ok">{msg}</div> : null}

        <div className="game-cover-grid">
          {filtered.length ? (
            filtered.map((g) => {
              const src = coverSrc(g);
              const showImg = Boolean(src) && !broken[g.id];
              return (
                <button
                  key={g.id}
                  type="button"
                  className="game-cover"
                  disabled={loadingId === g.id}
                  onClick={() => launch(g.id)}
                >
                  <span className="game-cover-media">
                    {showImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={src!}
                        alt={g.name}
                        onError={() => setBroken((b) => ({ ...b, [g.id]: true }))}
                      />
                    ) : (
                      <span className="game-cover-fallback">{g.name}</span>
                    )}
                    {loadingId === g.id ? <span className="game-cover-loading">啟動中…</span> : null}
                  </span>
                  <span className="game-cover-meta">
                    <strong>{g.name}</strong>
                    <span className="muted">{CATEGORY_LABEL[g.category] || g.category}</span>
                  </span>
                </button>
              );
            })
          ) : (
            <div className="card muted">沒有符合的遊戲</div>
          )}
        </div>
      </div>
    </div>
  );
}
