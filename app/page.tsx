import type { Metadata } from "next";
import PublicFeed from "../components/public/PublicFeed";
import PublicShell from "../components/public/PublicShell";
import { PublicAppearanceProvider } from "@/context/PublicAppearanceContext";
import CustomHome from "../components/home/CustomHome";
import {
  API_BASE_URL,
  SITE_NAME,
  SITE_URL,
  SITE_DESCRIPTION,
  getPublicAppearance,
  getPublicFeed,
} from "@/lib/server/api";

const ogImage = process.env.NEXT_PUBLIC_OG_IMAGE_URL;

export const dynamic = "force-dynamic";

const HOME_PAGE_ENABLED = process.env.NEXT_PUBLIC_HOME_PAGE_ENABLED === "true";

export async function generateMetadata(): Promise<Metadata> {
  // When a custom homepage is enabled, describe it as the site root.
  // Feed-specific CollectionPage metadata then lives only at /feed.
  if (HOME_PAGE_ENABLED) {
    return {
      title: { absolute: SITE_NAME },
      description: SITE_DESCRIPTION,
      openGraph: {
        title: { absolute: SITE_NAME },
        description: SITE_DESCRIPTION,
        type: "website",
        siteName: SITE_NAME,
        images: ogImage ? [{ url: ogImage }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: { absolute: SITE_NAME },
        description: SITE_DESCRIPTION,
        images: ogImage ? [ogImage] : undefined,
      },
      alternates: { canonical: `${SITE_URL}/` },
    };
  }

  return {
    title: { absolute: SITE_NAME },
    description: SITE_DESCRIPTION,
    openGraph: {
      title: { absolute: SITE_NAME },
      description: SITE_DESCRIPTION,
      type: "website",
      siteName: SITE_NAME,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: { absolute: SITE_NAME },
      description: SITE_DESCRIPTION,
      images: ogImage ? [ogImage] : undefined,
    },
    alternates: { canonical: `${SITE_URL}/` },
  };
}

function buildFeedJsonLd(items: any[]) {
  const listItems = items.slice(0, 10).map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "CreativeWork",
      name: item.name,
      description: item.description || undefined,
      image: item.cover_url ? `${API_BASE_URL}${item.cover_url}` : undefined,
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
    "@id": `${SITE_URL}/`,
    name: `Featured | ${SITE_NAME}`,
    url: `${SITE_URL}/`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: listItems,
    },
  };
}

function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

export default async function Home() {
  const appearance = await getPublicAppearance().catch(() => null);

  // Developer-controlled homepage: NEXT_PUBLIC_HOME_PAGE_ENABLED=true
  // Convention: components/home/CustomHome.tsx overrides DefaultHome.tsx.
  // If the flag is false/unset, `/` falls back to the feed (existing behavior)
  // and `/feed` remains the feed regardless.
  if (HOME_PAGE_ENABLED) {
    return (
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
        <PublicShell noCenter>
          <CustomHome />
        </PublicShell>
      </PublicAppearanceProvider>
    );
  }

  const feed = await getPublicFeed(undefined, 20, 0).catch(() => null);
  const jsonLd = feed ? buildFeedJsonLd(feed.items) : null;

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
        <PublicFeed title="Featured" initialItems={feed?.items} />
      </PublicAppearanceProvider>
    </>
  );
}
