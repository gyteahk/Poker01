"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";

const PRODUCTS = [
  { href: "/sports", key: "nav.football", id: "football" },
  { href: "/games?cat=poker", key: "nav.poker", id: "poker" },
  { href: "/games", key: "nav.games", id: "games" },
  { href: "/wallet", key: "nav.wallet", id: "wallet" },
] as const;

function isProductActive(pathname: string, search: string, id: string) {
  if (id === "football") return pathname === "/sports" || pathname.startsWith("/sports/");
  if (id === "poker") return pathname.startsWith("/games") && search.includes("cat=poker");
  if (id === "games") return pathname.startsWith("/games") && !search.includes("cat=poker");
  if (id === "wallet") return pathname === "/wallet" || pathname.startsWith("/wallet/");
  return false;
}

function ProductNavInner({ showAdmin }: { showAdmin?: boolean }) {
  const pathname = usePathname() || "";
  const search = useSearchParams()?.toString() || "";
  const { t } = useI18n();

  return (
    <nav className="nav-products" aria-label={t("nav.products")}>
      {PRODUCTS.map((p) => (
        <Link
          key={p.id}
          href={p.href}
          className={isProductActive(pathname, search, p.id) ? "active" : undefined}
        >
          {t(p.key)}
        </Link>
      ))}
      {showAdmin ? (
        <Link href="/admin" className={pathname.startsWith("/admin") ? "active" : undefined}>
          {t("nav.admin")}
        </Link>
      ) : null}
    </nav>
  );
}

export function ProductNav({ showAdmin }: { showAdmin?: boolean }) {
  return (
    <Suspense fallback={<nav className="nav-products" />}>
      <ProductNavInner showAdmin={showAdmin} />
    </Suspense>
  );
}
