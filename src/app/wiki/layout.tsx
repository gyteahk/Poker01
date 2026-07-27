import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";

const title = "Poker小百科";
const fullTitle = "Poker小百科 | POKER01";
const description =
  "POKER01 Poker小百科：手牌排名、常用術語、心態分析，中英對照，新手友善。";

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
  },
  twitter: {
    card: "summary_large_image",
    title: fullTitle,
    description,
  },
};

export default function WikiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
