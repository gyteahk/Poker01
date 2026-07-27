import { CONTACT } from "@/lib/i18n";
import { getSiteUrl } from "@/lib/site";

export function SiteJsonLd() {
  const url = getSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        url,
        name: CONTACT.brand,
        description:
          "POKER01 — 一站式 Poker 資訊站：迷你遊戲、時事、小百科。",
        inLanguage: ["zh-Hant", "en"],
      },
      {
        "@type": "Organization",
        "@id": `${url}/#organization`,
        name: CONTACT.brand,
        url,
        logo: `${url}/logo-poker01.png`,
        sameAs: [CONTACT.telegramLink, CONTACT.whatsappLink],
        description: `ClubGG ${CONTACT.clubName} ${CONTACT.clubId}`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
