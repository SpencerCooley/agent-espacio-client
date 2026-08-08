import type { MetadataRoute } from "next";
import { SITE_URL, getPublicSitemap } from "@/lib/server/api";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/feed`, changeFrequency: "daily", priority: 0.9 },
  ];

  try {
    const data = await getPublicSitemap();
    for (const item of data.items) {
      urls.push({
        url: `${SITE_URL}/public/view/${item.public_magic_id}`,
        lastModified: item.updated_at ? new Date(item.updated_at) : undefined,
        changeFrequency: "weekly",
        priority: item.kind === "artifact" && item.type === "composer" ? 0.8 : 0.6,
      });
    }
  } catch {
    // API unreachable — return the static pages only.
  }

  return urls;
}
