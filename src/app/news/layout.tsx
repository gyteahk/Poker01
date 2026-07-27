import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";

const title = "時事快睇";
const fullTitle = "時事快睇 | POKER01";
const description =
  "POKER01 時事快睇：最新撲克話題，同 Poker 世界零距離。";

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
