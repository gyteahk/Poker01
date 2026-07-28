import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fromMicros } from "@/lib/money";
import { LogoutButton } from "@/components/LogoutButton";
import { ProductNav } from "@/components/ProductNav";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { serverT } from "@/lib/i18n/server";

export async function AppHeader() {
  const user = await getCurrentUser();
  let available = "0";
  if (user) {
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    available = fromMicros(wallet?.availableMicros ?? 0n);
  }
  const tBalance = await serverT("nav.balance");
  const tLogin = await serverT("nav.login");
  const tRegister = await serverT("nav.register");

  return (
    <header className="site-header">
      <div className="topbar">
        <Link href="/" className="brand" aria-label="cyber888.vip home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-header.png?v=8" alt="cyber888.vip" className="brand-logo" />
        </Link>
        <ProductNav showAdmin={user?.role === "ADMIN"} />
        <div className="nav-account">
          <LanguageSwitcher />
          {user ? (
            <>
              <div className="balance-chip">
                <span>{tBalance}</span>
                {available} USDT
              </div>
              <span className="user-chip">{user.displayName}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="auth-link">
                {tLogin}
              </Link>
              <Link href="/register" className="auth-link primary">
                {tRegister}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
