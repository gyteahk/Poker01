import type { Metadata } from "next";
import "./globals.css";
import { AppHeader } from "@/components/AppHeader";
import { AppChrome } from "@/components/AppChrome";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { getRequestLocale } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "cyber888.vip",
  description: "USDT-TRC20 casino & sports — cyber888.vip",
  icons: {
    icon: [
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: "/brand/logo-mark.png",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getRequestLocale();
  const htmlLang = locale === "en" ? "en" : locale;

  return (
    <html lang={htmlLang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Exo+2:wght@500;600;700;800&family=Rajdhani:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <I18nProvider initialLocale={locale}>
          <div className="app-shell">
            <AppHeader />
            <AppChrome>{children}</AppChrome>
            <MobileBottomNav />
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
