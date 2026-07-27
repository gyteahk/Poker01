import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsArticleView } from "@/components/NewsArticleView";
import { loadNewsArchive } from "@/lib/news";
import { newsExcerpt } from "@/lib/news-shared";
import { getSiteUrl } from "@/lib/site";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  const archive = await loadNewsArchive();
  return archive.articles.map((a) => ({ id: a.id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const archive = await loadNewsArchive();
  const article = archive.articles.find((a) => a.id === id);
  const siteUrl = getSiteUrl();

  if (!article) {
    return {
      title: "新聞不存在",
      robots: { index: false, follow: false },
    };
  }

  const title = article.title.zh || article.title.en;
  const description = newsExcerpt(article.body.zh || article.body.en, 140);
  const url = `${siteUrl}/news/${encodeURIComponent(article.id)}`;
  const image = article.imageUrl?.startsWith("http")
    ? article.imageUrl
    : article.imageUrl
      ? `${siteUrl}${article.imageUrl}`
      : `${siteUrl}/logo-poker01-256.png`;

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
      publishedTime: article.createdAt || article.date,
      images: [{ url: image, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | POKER01`,
      description,
      images: [image],
    },
  };
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const archive = await loadNewsArchive();
  const article = archive.articles.find((a) => a.id === id);
  if (!article) notFound();
  return <NewsArticleView article={article} />;
}
