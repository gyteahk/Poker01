"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PRODUCTS = [
  { href: "/sports", label: "體育" },
  { href: "/games", label: "遊戲" },
  { href: "/wallet", label: "錢包" },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ProductNav({ showAdmin }: { showAdmin?: boolean }) {
  const pathname = usePathname() || "";

  return (
    <nav className="nav-products" aria-label="產品">
      {PRODUCTS.map((p) => (
        <Link
          key={p.href}
          href={p.href}
          className={isActive(pathname, p.href) ? "active" : undefined}
        >
          {p.label}
        </Link>
      ))}
      {showAdmin ? (
        <Link href="/admin" className={isActive(pathname, "/admin") ? "active" : undefined}>
          後台
        </Link>
      ) : null}
    </nav>
  );
}
