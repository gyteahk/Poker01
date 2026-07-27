import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { I18nProvider } from "@/components/I18nProvider";
import {
  SiteFooter,
  SiteHeader,
  StickyClubCta,
} from "@/components/SiteChrome";
import { SiteJsonLd } from "@/components/SiteJsonLd";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const siteUrl = getSiteUrl();

export const viewport: Viewport = {
  themeColor: "#00c2d7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const titleDefault = "POKER01 | 一站式 Poker資訊站";
const description =
  "Poker01歡迎你——一站式 Poker 資訊站：小遊戲試玩、時事快睇、小百科，輕鬆玩、玩住學。";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: titleDefault,
    template: "%s | POKER01",
  },
  description,
  keywords: [
    "POKER01",
    "Poker",
    "撲克",
    "德州撲克",
    "Texas Hold'em",
    "迷你遊戲",
    "時事快睇",
    "Poker小百科",
    "心態",
    "決策",
  ],
  authors: [{ name: "POKER01" }],
  creator: "POKER01",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: titleDefault,
    description,
    url: siteUrl,
    siteName: "POKER01",
    locale: "zh_HK",
    type: "website",
    images: [
      {
        url: "/og-share.png",
        width: 1200,
        height: 630,
        alt: "POKER01 — 一站式 Poker 資訊站",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: titleDefault,
    description,
    images: ["/og-share.png"],
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon-poker01.png", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png" }],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "POKER01",
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className={`${spaceGrotesk.variable} ${plusJakarta.variable}`}>
      <body>
        <SiteJsonLd />
        <I18nProvider>
          <SiteHeader />
          <main className="main-with-cta">{children}</main>
          <SiteFooter />
          <StickyClubCta />
        </I18nProvider>
      </body>
    </html>
  );
}
