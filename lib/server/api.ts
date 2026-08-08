/**
 * Server-only API client for the Agent Espacio API.
 *
 * Used by Server Components, generateMetadata, and Route Handlers to fetch
 * public data during SSR. It talks to the API over its public URL
 * (NEXT_PUBLIC_API_URL) — the same URL browsers use — so the client server
 * and the API can live on the same machine or different machines.
 *
 * Public endpoints require no auth, so no credentials are needed here.
 * Fetch responses are cached with ISR (revalidate) so metadata stays fresh
 * without hammering the API on every request.
 *
 * IMPORTANT: never import this module from a Client Component — it is
 * server-only by design. Client components fetch directly as they always did.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Agent Espacio";
export const SITE_DESCRIPTION =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Collaborative workspace for AI agents and humans";

const DEFAULT_REVALIDATE = 60;

async function serverFetch<T>(path: string, revalidate: number = DEFAULT_REVALIDATE): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`API request failed (${res.status}): ${path}`);
  }

  return res.json() as Promise<T>;
}

// ============================================================================
// Public view types
// ============================================================================

export interface PublicAncestorItem {
  id: string;
  name: string;
  is_public: boolean;
  public_magic_id: string | null;
}

export interface PublicFolderItem {
  kind: string;
  id: string;
  name: string;
  type?: string;
  mime_type?: string;
  is_image?: boolean;
  is_public?: boolean;
  public_magic_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PublicViewData {
  kind: string;
  folder?: {
    id: string;
    name: string;
    path: string;
    parent_id: string | null;
    is_public: boolean;
    public_magic_id: string;
  };
  asset?: {
    id: string;
    name: string;
    mime_type: string;
    size_bytes: number;
    human_readable_size: string;
    is_image: boolean;
    public_magic_id: string;
  };
  artifact?: {
    id: string;
    name: string;
    type: string;
    description?: string;
    content: any;
    public_magic_id: string;
    created_at?: string | null;
    updated_at?: string | null;
    /** Signed URL for the featured image (meta.cover_asset_id), when set. */
    cover_url?: string | null;
    publish?: {
      render_mode: string;
      slug: string;
      allow_public_code_view?: boolean;
    } | null;
  };
  ancestors?: PublicAncestorItem[];
  items?: PublicFolderItem[];
  total_items?: number;
  public_theme?: {
    theme_id: string;
    mode: "light" | "dark";
    definition: PublicThemeDefinition | null;
  };
}

export interface PublicCompositionSection {
  artifact: any;
  caption: string | null;
  artifact_id: string;
}

export interface PublicCompositionData {
  kind: string;
  composer: {
    id: string;
    name: string;
    type: string;
    description: string | null;
    content: any;
    meta: Record<string, any>;
    cover_url: string | null;
    public_magic_id: string | null;
    created_at: string | null;
    updated_at: string | null;
  };
  sections: PublicCompositionSection[];
  public_theme?: any;
}

// ============================================================================
// Sitemap types
// ============================================================================

export interface PublicSitemapItem {
  kind: "folder" | "asset" | "artifact";
  id: string;
  name: string;
  type?: string;
  public_magic_id: string;
  updated_at: string | null;
}

export interface PublicSitemapData {
  items: PublicSitemapItem[];
  total: number;
}

// ============================================================================
// Public appearance (theme + branding, seeded into SSR'd public pages)
// ============================================================================

export interface PublicThemeDefinition {
  id: string;
  name: string;
  light_definition: Record<string, any>;
  dark_definition: Record<string, any>;
}

export interface PublicAppearanceData {
  theme: {
    theme_id: string;
    mode: "light" | "dark";
    definition: PublicThemeDefinition | null;
  };
  branding: {
    logo_light_asset_id: string | null;
    logo_dark_asset_id: string | null;
    background_asset_id: string | null;
    background_style: "cover" | "tile";
    logo_light_url: string | null;
    logo_dark_url: string | null;
    background_url: string | null;
  };
}

export function getPublicAppearance(): Promise<PublicAppearanceData> {
  return serverFetch<PublicAppearanceData>(`/public/appearance`);
}

// ============================================================================
// Public data fetchers
// ============================================================================

export function getPublicView(magicId: string): Promise<PublicViewData> {
  return serverFetch<PublicViewData>(`/public/view/${magicId}`);
}

export function getPublicComposition(magicId: string): Promise<PublicCompositionData> {
  return serverFetch<PublicCompositionData>(`/public/composition/${magicId}`);
}

export function getPublicSitemap(): Promise<PublicSitemapData> {
  return serverFetch<PublicSitemapData>("/public/sitemap", 300);
}
