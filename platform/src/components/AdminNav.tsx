"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "總覽", exact: true },
  { href: "/admin/withdrawals", label: "提現審核" },
  { href: "/admin/deposits", label: "充值紀錄" },
  { href: "/admin/members", label: "會員" },
  { href: "/admin/ledger", label: "流水" },
] as const;

export function AdminNav() {
  const pathname = usePathname() || "";

  return (
    <nav className="admin-nav" aria-label="後台">
      {LINKS.map((l) => {
        const active =
          "exact" in l && l.exact
            ? pathname === l.href
            : pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link key={l.href} href={l.href} className={active ? "active" : undefined}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
