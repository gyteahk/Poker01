"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const hideFooter =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/sports") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  return (
    <>
      <div className="app-main">{children}</div>
      {hideFooter ? null : <SiteFooter />}
    </>
  );
}
