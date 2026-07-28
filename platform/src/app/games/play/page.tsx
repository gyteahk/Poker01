"use client";

import { useEffect, useState } from "react";

export default function GamePlayPage() {
  const [info, setInfo] = useState({ session: "", game: "" });

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setInfo({ session: q.get("session") || "", game: q.get("game") || "" });
  }, []);

  return (
    <div className="app-body">
      <div className="card stack">
        <div className="panel-head" style={{ margin: "-0.9rem -1rem 0.75rem" }}>
          遊戲 Session
        </div>
        <h1>Stub 啟動頁</h1>
        <p className="muted">此頁模擬外接遊戲 iframe／跳轉位。接真 provider 後改為對方 launch URL。</p>
        <div>
          Game: <span className="mono">{info.game}</span>
        </div>
        <div>
          Session: <span className="mono">{info.session}</span>
        </div>
        <a className="btn secondary" href="/games">
          返回大廳
        </a>
      </div>
    </div>
  );
}
