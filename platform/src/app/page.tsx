import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fromMicros } from "@/lib/money";

export default async function HomePage() {
  const user = await getCurrentUser();
  let available = "0";
  if (user) {
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    available = fromMicros(wallet?.availableMicros ?? 0n);
  }

  return (
    <div className="app-body">
      <div className="stack" style={{ gap: "0.85rem" }}>
        <section className="page-title-bar home-hero">
          <div>
            <h1>cyber888.win</h1>
            <p className="muted">體育盤口 · 遊戲大廳 · USDT-TRC20 錢包</p>
          </div>
          {user ? (
            <div className="home-balance">
              <span className="muted">可用餘額</span>
              <strong>{available} USDT</strong>
            </div>
          ) : (
            <div className="row">
              <Link className="btn" href="/register">
                註冊
              </Link>
              <Link className="btn secondary" href="/login">
                登入
              </Link>
            </div>
          )}
        </section>

        <section className="home-tiles">
          <Link href="/sports" className="home-tile">
            <span className="home-tile-kicker">Sports</span>
            <strong>足球盤口</strong>
            <span className="muted">1X2 · 注單鎖碼</span>
          </Link>
          <Link href="/games" className="home-tile">
            <span className="home-tile-kicker">Casino</span>
            <strong>遊戲大廳</strong>
            <span className="muted">老虎機 · 真人 · 打魚</span>
          </Link>
          <Link href="/wallet" className="home-tile">
            <span className="home-tile-kicker">Wallet</span>
            <strong>充值／提現</strong>
            <span className="muted">USDT-TRC20</span>
          </Link>
        </section>
      </div>
    </div>
  );
}
