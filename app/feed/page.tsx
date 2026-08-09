import type { Metadata } from "next";
import FeedClient from "./feed-client";
import { PublicAppearanceProvider } from "../../context/PublicAppearanceContext";
import {
  SITE_NAME,
  SITE_URL,
  getPublicAppearance,
  getPublicFeed,
} from "@/lib/server/api";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { tag } = await searchParams;
  const tagStr = typeof tag === "string" ? tag : undefined;
  const title = tagStr ? `${tagStr} | ${SITE_NAME}` : `Feed | ${SITE_NAME}`;
  const description = tagStr
    ? `Public compositions tagged with ${tagStr} on ${SITE_NAME}.`
    : `Curated public feed — compositions, stories, and interactive content from ${SITE_NAME}.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website", siteName: SITE_NAME },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: `${SITE_URL}/feed${tagStr ? `?tag=${encodeURIComponent(tagStr)}` : ""}` },
  };
}

function buildFeedJsonLd(items: any[], tagStr?: string) {
  const listItems = items.slice(0, 10).map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "CreativeWork",
      name: item.name,
      description: item.description || undefined,
      image: item.cover_url ? `${process.env.NEXT_PUBLIC_API_URL || ""}${item.cover_url}` : undefined,
      url: item.public_magic_id
        ? `${SITE_URL}/public/view/${item.public_magic_id}`
        : undefined,
      datePublished: item.created_at || undefined,
      dateModified: item.updated_at || undefined,
      inLanguage: "en",
    },
  }));

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: tagStr ? `${tagStr} | ${SITE_NAME}` : `Feed | ${SITE_NAME}`,
    url: `${SITE_URL}/feed${tagStr ? `?tag=${encodeURIComponent(tagStr)}` : ""}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: listItems,
    },
  };
}

function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

export default async function TagFeedPage({ searchParams }: PageProps) {
  const { tag } = await searchParams;
  const tagStr = typeof tag === "string" ? tag : undefined;

  const appearance = await getPublicAppearance().catch(() => null);
  const feed = await getPublicFeed(tagStr, 20, 0).catch(() => null);

  const jsonLd = feed ? buildFeedJsonLd(feed.items, tagStr) : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      )}
      <PublicAppearanceProvider
        initial={
          appearance
            ? {
                themeId: appearance.theme.theme_id,
                mode: appearance.theme.mode,
                definition: appearance.theme.definition,
                branding: appearance.branding,
              }
            : undefined
        }
      >
        <FeedClient initialItems={feed?.items} tag={tagStr} />
      </PublicAppearanceProvider>
    </>
  );
}
