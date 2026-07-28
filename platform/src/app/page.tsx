import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fromMicros } from "@/lib/money";
import { serverT } from "@/lib/i18n/server";
import { CATEGORY_WIDE } from "@/lib/categories";

export default async function HomePage() {
  const user = await getCurrentUser();
  let available = "0";
  if (user) {
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    available = fromMicros(wallet?.availableMicros ?? 0n);
  }

  const copy = {
    tagline: await serverT("home.tagline"),
    lead: await serverT("home.lead"),
    deposit: await serverT("home.deposit"),
    seeOdds: await serverT("home.seeOdds"),
    register: await serverT("home.register"),
    login: await serverT("home.login"),
    whyUsdt: await serverT("home.whyUsdt"),
    available: await serverT("home.available"),
    wallet: await serverT("home.wallet"),
    creditedActual: await serverT("home.creditedActual"),
    withdrawRisk: await serverT("home.withdrawRisk"),
    learnDeposit: await serverT("home.learnDeposit"),
    footballKicker: await serverT("home.tile.sports.kicker"),
    footballTitle: await serverT("home.tile.sports.title"),
    footballSub: await serverT("home.tile.sports.sub"),
    pokerKicker: await serverT("home.tile.poker.kicker"),
    pokerTitle: await serverT("home.tile.poker.title"),
    pokerSub: await serverT("home.tile.poker.sub"),
    gamesKicker: await serverT("home.tile.games.kicker"),
    gamesTitle: await serverT("home.tile.games.title"),
    gamesSub: await serverT("home.tile.games.sub"),
    walletKicker: await serverT("home.tile.wallet.kicker"),
    walletTitle: await serverT("home.tile.wallet.title"),
    walletSub: await serverT("home.tile.wallet.sub"),
  };

  const tiles = [
    {
      href: "/sports",
      img: CATEGORY_WIDE.football,
      kicker: copy.footballKicker,
      title: copy.footballTitle,
      sub: copy.footballSub,
    },
    {
      href: "/games?cat=poker",
      img: CATEGORY_WIDE.poker,
      kicker: copy.pokerKicker,
      title: copy.pokerTitle,
      sub: copy.pokerSub,
    },
    {
      href: "/games",
      img: CATEGORY_WIDE.games,
      kicker: copy.gamesKicker,
      title: copy.gamesTitle,
      sub: copy.gamesSub,
    },
    {
      href: "/wallet",
      img: CATEGORY_WIDE.wallet,
      kicker: copy.walletKicker,
      title: copy.walletTitle,
      sub: copy.walletSub,
    },
  ] as const;

  return (
    <div className="app-body home-page">
      <div className="stack" style={{ gap: "0.85rem" }}>
        <section className="home-hero-panel">
          <div className="home-hero-copy">
            <p className="home-hero-brand">cyber888.vip</p>
            <h1>{copy.tagline}</h1>
            <p className="home-hero-lead muted">{copy.lead}</p>
            <div className="row home-hero-cta">
              {user ? (
                <>
                  <Link className="btn" href="/wallet">
                    {copy.deposit}
                  </Link>
                  <Link className="btn secondary" href="/sports">
                    {copy.seeOdds}
                  </Link>
                </>
              ) : (
                <>
                  <Link className="btn" href="/register">
                    {copy.register}
                  </Link>
                  <Link className="btn secondary" href="/login">
                    {copy.login}
                  </Link>
                  <Link className="btn secondary" href="/help/usdt">
                    {copy.whyUsdt}
                  </Link>
                </>
              )}
            </div>
          </div>
          {user ? (
            <div className="home-balance-panel">
              <span className="muted">{copy.available}</span>
              <strong>{available}</strong>
              <span className="muted">USDT</span>
              <Link className="btn" href="/wallet" style={{ marginTop: "0.55rem" }}>
                {copy.wallet}
              </Link>
            </div>
          ) : (
            <div className="home-trust-panel">
              <span className="badge ok">TRC20</span>
              <p>
                {copy.creditedActual}
                <br />
                {copy.withdrawRisk}
              </p>
              <Link href="/help/usdt" className="muted">
                {copy.learnDeposit}
              </Link>
            </div>
          )}
        </section>

        <section className="home-tiles home-tiles-4">
          {tiles.map((tile) => (
            <Link key={tile.href} href={tile.href} className="home-tile home-tile-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tile.img} alt="" className="home-tile-img" />
              <span className="home-tile-shade" />
              <span className="home-tile-kicker">{tile.kicker}</span>
              <strong>{tile.title}</strong>
              <span className="muted">{tile.sub}</span>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
