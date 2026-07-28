import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fromMicros } from "@/lib/money";
import { LogoutButton } from "@/components/LogoutButton";
import { ProductNav } from "@/components/ProductNav";

export async function AppHeader() {
  const user = await getCurrentUser();
  let available = "0";
  if (user) {
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    available = fromMicros(wallet?.availableMicros ?? 0n);
  }

  return (
    <header className="site-header">
      <div className="topbar">
        <Link href="/" className="brand" aria-label="cyber888.win home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.svg" alt="cyber888.win" className="brand-logo" />
        </Link>
        <ProductNav showAdmin={user?.role === "ADMIN"} />
        <div className="nav-account">
          {user ? (
            <>
              <div className="balance-chip">
                <span>餘額</span>
                {available} USDT
              </div>
              <span className="user-chip">{user.displayName}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="auth-link">
                登入
              </Link>
              <Link href="/register" className="auth-link primary">
                註冊
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
