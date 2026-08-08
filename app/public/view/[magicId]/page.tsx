import type { Metadata } from "next";
import PublicShell from "@/components/public/PublicShell";
import PublicViewClient from "@/components/public/PublicViewClient";
import ComposerPublicView from "@/components/workspace/ComposerPublicView";
import {
  API_BASE_URL,
  SITE_NAME,
  SITE_URL,
  getPublicView,
  getPublicComposition,
  type PublicViewData,
  type PublicCompositionData,
} from "@/lib/server/api";
// This route renders at request time so every public page ships its own
// OpenGraph/Twitter metadata, JSON-LD, and semantic HTML. It also keeps the
// `next build` hermetic — no API calls happen at build time.
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ magicId: string }>;
}

// ============================================================================
// Server-rendered metadata (per-item OG/Twitter tags)
// ============================================================================

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { magicId } = await params;

  try {
    const view = await getPublicView(magicId);
    const name = view.folder?.name || view.asset?.name || view.artifact?.name || magicId;
    let description = view.artifact?.description ?? undefined;
    let image: string | undefined;
    let ogType: "website" | "article" = "website";

    if (view.kind === "artifact" && view.artifact?.type === "composer") {
      const comp = await getPublicComposition(magicId).catch(() => null);
      if (comp?.composer) {
        description =
          description ||
          comp.composer.description ||
          comp.composer.meta?.excerpt ||
          undefined;
        if (comp.composer.cover_url) {
          image = `${API_BASE_URL}${comp.composer.cover_url}`;
        }
      }
      ogType = "article";
    }

    const url = `${SITE_URL}/public/view/${magicId}`;

    return {
      title: name,
      description,
      openGraph: {
        title: name,
        description,
        type: ogType,
        url,
        siteName: SITE_NAME,
        images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: name,
        description,
        images: image ? [image] : undefined,
      },
      alternates: { canonical: url },
    };
  } catch {
    return {};
  }
}

// ============================================================================
// Semantic SSR helpers
// ============================================================================

function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

// ============================================================================
// Composer SSR page (the exemplar)
// ============================================================================

function ComposerSemanticPage({
  view,
  composition,
  magicId,
}: {
  view: PublicViewData;
  composition: PublicCompositionData | null;
  magicId: string;
}) {
  const composer = composition?.composer;
  const name = view.artifact?.name || composer?.name || "Composition";
  const description =
    view.artifact?.description ||
    composer?.description ||
    composer?.meta?.excerpt ||
    "";
  const coverUrl = composer?.cover_url ? `${API_BASE_URL}${composer.cover_url}` : null;
  const sections = composition?.sections || [];
  const canonical = `${SITE_URL}/public/view/${magicId}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: name,
    description: description || undefined,
    datePublished: composer?.created_at || undefined,
    dateModified: composer?.updated_at || undefined,
    image: coverUrl || undefined,
    url: canonical,
    inLanguage: "en",
    mainEntityOfPage: canonical,
    publisher: { "@type": "Organization", name: SITE_NAME },
    hasPart: sections.map((s, i) => ({
      "@type": s.artifact?.mime_type ? "MediaObject" : "CreativeWork",
      name: s.artifact?.name || `Section ${i + 1}`,
      description: s.artifact?.description || s.caption || undefined,
      position: i + 1,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <ComposerPublicView
        artifactId={composer?.id || view.artifact?.id || magicId}
        publicMagicId={magicId}
        initialData={composition || undefined}
        themeMode={view.public_theme?.mode}
      />
    </>
  );
}

// ============================================================================
// Page
// ============================================================================

export default async function PublicViewPage({ params }: PageProps) {
  const { magicId } = await params;

  let view: PublicViewData | null = null;
  try {
    view = await getPublicView(magicId);
  } catch {
    // Fall back to the client renderer, which surfaces the error state.
    return <PublicViewClient />;
  }

  const isComposer = view.kind === "artifact" && view.artifact?.type === "composer";

  if (!isComposer) {
    // Non-composer public pages keep their existing client-rendered
    // experience for now; SSR rolls out to them in a later session.
    return <PublicViewClient />;
  }

  const composition = await getPublicComposition(magicId).catch(() => null);

  return (
    <PublicShell>
      <ComposerSemanticPage view={view} composition={composition} magicId={magicId} />
    </PublicShell>
  );
}
