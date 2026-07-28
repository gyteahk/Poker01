"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";

const ITEMS = [
  { href: "/sports", key: "nav.football", mark: "sports", id: "football" },
  { href: "/games?cat=poker", key: "nav.poker", mark: "poker", id: "poker" },
  { href: "/games", key: "nav.games", mark: "games", id: "games" },
  { href: "/wallet", key: "nav.wallet", mark: "wallet", id: "wallet" },
] as const;

function isProductActive(pathname: string, search: string, id: string) {
  if (id === "football") return pathname === "/sports" || pathname.startsWith("/sports/");
  if (id === "poker") return pathname.startsWith("/games") && search.includes("cat=poker");
  if (id === "games") return pathname.startsWith("/games") && !search.includes("cat=poker");
  if (id === "wallet") return pathname === "/wallet" || pathname.startsWith("/wallet/");
  return false;
}

function MobileBottomNavInner() {
  const pathname = usePathname() || "";
  const search = useSearchParams()?.toString() || "";
  const { t } = useI18n();
  if (pathname.startsWith("/admin") || pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return null;
  }

  return (
    <nav className="mobile-bottom-nav" aria-label={t("nav.main")}>
      {ITEMS.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={
            isProductActive(pathname, search, item.id) ? `active mark-${item.mark}` : `mark-${item.mark}`
          }
        >
          <span className={`mobile-bottom-mark mark-${item.mark}`} aria-hidden />
          <span>{t(item.key)}</span>
        </Link>
      ))}
    </nav>
  );
}

export function MobileBottomNav() {
  return (
    <Suspense fallback={null}>
      <MobileBottomNavInner />
    </Suspense>
  );
}
