import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";

const title = "Poker小百科｜德州撲克新手教學同術語";
const fullTitle = "Poker小百科｜德州撲克新手教學同術語 | POKER01";
const description =
  "POKER01 Poker小百科：德州撲克規則、底池賠率、Tilt 心態、盲注結構、MTT 入門、手牌排名同常用術語，中英對照。";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${getSiteUrl()}/wiki` },
  openGraph: {
    title: fullTitle,
    description,
    url: `${getSiteUrl()}/wiki`,
    siteName: "POKER01",
    type: "website",
    locale: "zh_HK",
    images: [{ url: "/og-share.png", width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title: fullTitle,
    description,
    images: ["/og-share.png"],
  },
};

export default function WikiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
