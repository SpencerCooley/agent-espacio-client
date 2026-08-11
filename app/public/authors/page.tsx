import type { Metadata } from "next";
import PublicShell from "@/components/public/PublicShell";
import { PublicAppearanceProvider } from "@/context/PublicAppearanceContext";
import {
  API_BASE_URL,
  SITE_NAME,
  SITE_URL,
  SITE_DESCRIPTION,
  getPublicAuthors,
  getPublicAppearance,
  type PublicAuthorListItem,
} from "@/lib/server/api";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const title = `Authors | ${SITE_NAME}`;
  const description = `All authors publishing on ${SITE_NAME} — ${SITE_DESCRIPTION}`;
  const url = `${SITE_URL}/public/authors`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}

function buildAuthorsJsonLd(authors: PublicAuthorListItem[]) {
  const url = `${SITE_URL}/public/authors`;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": url,
    name: `Authors | ${SITE_NAME}`,
    url,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: authors.slice(0, 20).map((author, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Person",
          name: author.display_name,
          description: author.bio || undefined,
          image: author.avatar_url
            ? `${API_BASE_URL}${author.avatar_url}`
            : undefined,
          url: `${SITE_URL}/public/profile/${author.user_id}`,
        },
      })),
    },
  };
}

function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

export default async function PublicAuthorsPage() {
  const appearance = await getPublicAppearance().catch(() => null);
  const authors = await getPublicAuthors().catch(() => [] as PublicAuthorListItem[]);
  const jsonLd = buildAuthorsJsonLd(authors);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
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
        <style>{`
          .author-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
        `}</style>
        <PublicShell>
          <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 8 }}>
              Authors
            </h1>
            <p
              style={{
                margin: "0 0 40px",
                color: "var(--mui-palette-text-secondary)",
                fontSize: "1rem",
              }}
            >
              People publishing compositions on {SITE_NAME}
            </p>

            {authors.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--mui-palette-text-secondary)" }}>
                No authors yet.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 20,
                }}
              >
                {authors.map((author) => {
                  const avatarUrl = author.avatar_url
                    ? `${API_BASE_URL}${author.avatar_url}`
                    : null;

                  return (
                    <a
                      key={author.user_id}
                      href={`/public/profile/${author.user_id}`}
                      className="author-card"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        padding: 20,
                        borderRadius: 12,
                        textDecoration: "none",
                        color: "inherit",
                        border: "1px solid",
                        borderColor: "var(--mui-palette-divider)",
                        transition: "box-shadow 0.2s",
                      }}
                    >
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={author.display_name}
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: "50%",
                            objectFit: "cover",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: "50%",
                            backgroundColor: "var(--mui-palette-primary-main)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 24,
                            fontWeight: 700,
                            color: "white",
                            flexShrink: 0,
                          }}
                        >
                          {author.display_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "1rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {author.display_name}
                        </div>
                        {author.bio && (
                          <div
                            style={{
                              fontSize: "0.85rem",
                              color: "var(--mui-palette-text-secondary)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              marginTop: 4,
                            }}
                          >
                            {author.bio}
                          </div>
                        )}
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--mui-palette-text-secondary)",
                            marginTop: 4,
                          }}
                        >
                          {author.composition_count} composition
                          {author.composition_count !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </PublicShell>
      </PublicAppearanceProvider>
    </>
  );
}