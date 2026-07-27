import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WikiArticleView } from "@/components/WikiArticleView";
import { getSiteUrl } from "@/lib/site";
import { getWikiArticle, listWikiArticles } from "@/lib/wiki-articles";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return listWikiArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getWikiArticle(slug);
  const siteUrl = getSiteUrl();

  if (!article) {
    return {
      title: "文章不存在",
      robots: { index: false, follow: false },
    };
  }

  const title = article.title.zh;
  const description = article.description.zh;
  const url = `${siteUrl}/wiki/${article.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | POKER01`,
      description,
      url,
      siteName: "POKER01",
      type: "article",
      locale: "zh_HK",
      publishedTime: article.updatedAt,
      images: [
        {
          url: "/og-share.png",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | POKER01`,
      description,
      images: ["/og-share.png"],
    },
  };
}

export default async function WikiArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getWikiArticle(slug);
  if (!article) notFound();

  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title.zh,
    description: article.description.zh,
    dateModified: article.updatedAt,
    inLanguage: "zh-Hant",
    author: { "@type": "Organization", name: "POKER01" },
    publisher: {
      "@type": "Organization",
      name: "POKER01",
      logo: { "@type": "ImageObject", url: `${siteUrl}/logo-poker01.png` },
    },
    mainEntityOfPage: `${siteUrl}/wiki/${article.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <WikiArticleView article={article} />
    </>
  );
}
