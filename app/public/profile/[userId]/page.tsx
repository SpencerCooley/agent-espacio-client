import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicShell from "@/components/public/PublicShell";
import { PublicAppearanceProvider } from "@/context/PublicAppearanceContext";
import {
  API_BASE_URL,
  SITE_NAME,
  SITE_URL,
  getPublicProfile,
  getPublicAppearance,
  type PublicProfileWithCompositions,
} from "@/lib/server/api";
import PublicProfileContent from "./PublicProfileContent";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params;
  const userIdNum = parseInt(userId, 10);

  if (isNaN(userIdNum)) {
    return { title: "Profile Not Found" };
  }

  try {
    const profile = await getPublicProfile(userIdNum);
    const name = profile.display_name || `User ${userIdNum}`;
    const description = profile.bio || `Public compositions by ${name} (${profile.total})`;
    const url = `${SITE_URL}/public/profile/${userIdNum}`;

    return {
      title: name,
      description,
      openGraph: {
        title: name,
        description,
        type: "profile",
        url,
        siteName: SITE_NAME,
        images: profile.avatar_url
          ? [{ url: `${API_BASE_URL}${profile.avatar_url}` }]
          : undefined,
      },
      twitter: {
        card: "summary",
        title: name,
        description,
        images: profile.avatar_url
          ? [`${API_BASE_URL}${profile.avatar_url}`]
          : undefined,
      },
      alternates: {
        canonical: url,
      },
    };
  } catch {
    return { title: "Profile Not Found" };
  }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { userId } = await params;
  const userIdNum = parseInt(userId, 10);

  if (isNaN(userIdNum)) notFound();

  let profile: PublicProfileWithCompositions;
  try {
    profile = await getPublicProfile(userIdNum);
  } catch {
    notFound();
  }

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
      <PublicShell>
        <PublicProfileContent
          userId={userIdNum}
          initialData={profile}
        />
      </PublicShell>
    </PublicAppearanceProvider>
  );
}