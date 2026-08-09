import type { Metadata } from "next";
import PublicShell from "@/components/public/PublicShell";
import PublicViewClient from "@/components/public/PublicViewClient";
import ComposerPublicView from "@/components/workspace/ComposerPublicView";
import { PublicAppearanceProvider } from "@/context/PublicAppearanceContext";
import { extractNoteText } from "@/lib/server/content-text";
import {
  API_BASE_URL,
  SITE_NAME,
  SITE_URL,
  getPublicView,
  getPublicComposition,
  getPublicAppearance,
  type PublicViewData,
  type PublicCompositionData,
  type PublicAppearanceData,
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
    let ogType: "website" | "article" = "website";

    if (view.kind === "artifact" && view.artifact?.type === "composer") {
      const comp = await getPublicComposition(magicId).catch(() => null);
      if (comp?.composer) {
        description =
          description ||
          comp.composer.description ||
          comp.composer.meta?.excerpt ||
          undefined;
      }
      ogType = "article";
    }

    const url = `${SITE_URL}/public/view/${magicId}`;

    // og:image is provided by the opengraph-image.tsx file convention in the
    // same route segment. It handles redirects to actual covers and renders a
    // branded fallback card for everything else. The convention URL is stable
    // and never expires, unlike the signed cover URLs we used previously.
    return {
      title: name,
      description,
      openGraph: {
        title: name,
        description,
        type: ogType,
        url,
        siteName: SITE_NAME,
      },
      twitter: {
        card: "summary_large_image",
        title: name,
        description,
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

/**
 * JSON-LD for non-composer artifact pages (maps, workflows, notes, galleries, repos).
 * The interactive body stays client-rendered; this gives crawlers/social cards the metadata.
 */
function buildArtifactJsonLd(view: PublicViewData, magicId: string) {
  if (view.kind !== "artifact" || !view.artifact) return null;
  const type = view.artifact.type;
  if (type !== "map" && type !== "workflow" && type !== "note" && type !== "gallery" && type !== "repo") {
    return null;
  }

  const canonical = `${SITE_URL}/public/view/${magicId}`;
  const base = {
    "@context": "https://schema.org",
    name: view.artifact.name,
    description: view.artifact.description || undefined,
    datePublished: view.artifact.created_at || undefined,
    dateModified: view.artifact.updated_at || undefined,
    image: view.artifact.cover_url
      ? `${API_BASE_URL}${view.artifact.cover_url}`
      : undefined,
    url: canonical,
    inLanguage: "en",
    mainEntityOfPage: canonical,
    publisher: { "@type": "Organization", name: SITE_NAME },
  };

  if (type === "map") {
    return { ...base, "@type": "Map" };
  }
  if (type === "workflow") {
    return { ...base, "@type": "CreativeWork" };
  }
  if (type === "note") {
    const body = extractNoteText(view.artifact.content?.content, 2000);
    return { ...base, "@type": "Article", articleBody: body || undefined };
  }
  if (type === "gallery") {
    return { ...base, "@type": "ImageGallery" };
  }
  if (type === "repo") {
    const publish = view.artifact.content?.publish || view.artifact.publish;
    const isPublishedSite = publish?.render_mode === "embedded" || publish?.render_mode === "direct";
    if (isPublishedSite) {
      return { ...base, "@type": "WebSite" };
    }
    return {
      ...base,
      "@type": "SoftwareSourceCode",
      codeRepository: `${API_BASE_URL}/public/repo/${view.artifact.public_magic_id}`,
    };
  }
  return null;
}

/**
 * JSON-LD for public asset pages. Tells crawlers exactly what the file is,
 * where to download it, and what its thumbnail looks like.
 */
function buildAssetJsonLd(view: PublicViewData, magicId: string) {
  if (view.kind !== "asset" || !view.asset) return null;

  const asset = view.asset;
  const canonical = `${SITE_URL}/public/view/${magicId}`;
  const mime = asset.mime_type || "";

  let schemaType = "MediaObject";
  if (asset.is_image) schemaType = "ImageObject";
  else if (mime.startsWith("video/")) schemaType = "VideoObject";
  else if (mime.startsWith("audio/")) schemaType = "AudioObject";
  else if (mime === "application/pdf") schemaType = "DigitalDocument";

  return {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: asset.name,
    contentUrl: asset.download_url,
    encodingFormat: asset.mime_type,
    contentSize: String(asset.size_bytes),
    thumbnailUrl: asset.thumbnail_url || undefined,
    url: canonical,
    datePublished: asset.created_at || undefined,
    dateModified: asset.updated_at || undefined,
    inLanguage: "en",
    mainEntityOfPage: canonical,
    publisher: { "@type": "Organization", name: SITE_NAME },
  };
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
    "@id": canonical,
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
      "@id": s.artifact?.public_magic_id
        ? `${SITE_URL}/public/view/${s.artifact.public_magic_id}`
        : undefined,
      name: s.artifact?.name || `Section ${i + 1}`,
      description: s.artifact?.description || s.caption || undefined,
      url: s.artifact?.public_magic_id
        ? `${SITE_URL}/public/view/${s.artifact.public_magic_id}`
        : s.artifact_id
          ? `${SITE_URL}/public/view/${s.artifact_id}`
          : undefined,
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

/**
 * Map the /public/appearance API payload onto the provider's seed shape.
 * Returns undefined when the fetch failed — the provider then falls back to
 * its client-side fetch exactly as before.
 */
function toAppearanceInitial(data: PublicAppearanceData | null) {
  if (!data) return undefined;
  return {
    themeId: data.theme.theme_id,
    mode: data.theme.mode,
    definition: data.theme.definition,
    branding: data.branding,
  };
}

export default async function PublicViewPage({ params }: PageProps) {
  const { magicId } = await params;

  let view: PublicViewData | null = null;
  try {
    view = await getPublicView(magicId);
  } catch {
    // Fall back to the client renderer, which surfaces the error state.
    return <PublicViewClient />;
  }

  // Seed theme + branding during SSR so visitors never see the default theme
  // flash while the client fetches appearance.
  const appearance = await getPublicAppearance().catch(() => null);
  const appearanceInitial = toAppearanceInitial(appearance);

  const isComposer = view.kind === "artifact" && view.artifact?.type === "composer";

  if (!isComposer) {
    // Non-composer public pages keep their existing client-rendered
    // experience; we add JSON-LD so maps/workflows/assets carry full OG/search
    // metadata even without a server-rendered body.
    const jsonLd =
      buildArtifactJsonLd(view, magicId) || buildAssetJsonLd(view, magicId);
    return (
      <PublicAppearanceProvider initial={appearanceInitial}>
        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
          />
        )}
        <PublicViewClient />
      </PublicAppearanceProvider>
    );
  }

  const composition = await getPublicComposition(magicId).catch(() => null);

  return (
    <PublicAppearanceProvider initial={appearanceInitial}>
      <PublicShell>
        <ComposerSemanticPage view={view} composition={composition} magicId={magicId} />
      </PublicShell>
    </PublicAppearanceProvider>
  );
}
