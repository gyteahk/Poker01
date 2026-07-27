import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";

const title = "撲克新聞時事快睇";
const fullTitle = "撲克新聞時事快睇 | POKER01";
const description =
  "POKER01 時事快睇：最新撲克新聞同話題整理，幫你跟上 Poker 世界動態。";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${getSiteUrl()}/news` },
  openGraph: {
    title: fullTitle,
    description,
    url: `${getSiteUrl()}/news`,
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

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
