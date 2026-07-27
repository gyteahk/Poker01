import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";

const title = "小遊戲試玩";
const fullTitle = "小遊戲試玩 | POKER01";
const description =
  "POKER01 小遊戲試玩：今日決策、迷你遊戲、牌型快問——暖身完再上 ClubGG。";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${getSiteUrl()}/play` },
  openGraph: {
    title: fullTitle,
    description,
    url: `${getSiteUrl()}/play`,
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

export default function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
