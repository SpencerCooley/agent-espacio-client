import PublicFeed from "../components/public/PublicFeed";
import { PublicAppearanceProvider } from "../context/PublicAppearanceContext";
import { getPublicAppearance } from "@/lib/server/api";

// Rendered at request time so the public theme/branding can be seeded into
// the page — no flash of the default theme while the client fetches. The
// underlying API call is cached (revalidate: 60), so this stays cheap.
export const dynamic = "force-dynamic";

export default async function Home() {
  const appearance = await getPublicAppearance().catch(() => null);

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
      <PublicFeed title="Featured" />
    </PublicAppearanceProvider>
  );
}
