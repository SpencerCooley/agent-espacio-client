/**
 * Public Profile Content - Client component with pagination.
 *
 * Displays the author's profile and their compositions with "View more" loading.
 */
"use client";

import React, { useState } from "react";
import {
  API_BASE_URL,
  type PublicProfileWithCompositions,
  type PublicCompositionInfo,
} from "@/lib/server/api";

interface Props {
  userId: number;
  initialData: PublicProfileWithCompositions;
}

export default function PublicProfileContent({ userId, initialData }: Props) {
  const [profile, setProfile] = useState(initialData);
  const [compositions, setCompositions] = useState(initialData.compositions);
  const [total] = useState(initialData.total);
  const [hasMore, setHasMore] = useState(initialData.has_more);
  const [loading, setLoading] = useState(false);

  const avatarUrl = profile.avatar_url
    ? `${API_BASE_URL}${profile.avatar_url}`
    : null;

  const loadMore = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/public/profiles/${userId}?limit=6&offset=${compositions.length}`
      );
      const data: PublicProfileWithCompositions = await res.json();
      setCompositions((prev) => [...prev, ...data.compositions]);
      setHasMore(data.has_more);
    } catch (err) {
      console.error("Failed to load more compositions", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px" }}>
      {/* Profile Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          marginBottom: 40,
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={profile.display_name || "Profile"}
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              backgroundColor: "var(--mui-palette-primary-main)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 700,
              color: "white",
              flexShrink: 0,
            }}
          >
            {(profile.display_name || "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 700 }}>
            {profile.display_name || `User ${profile.user_id}`}
          </h1>
          {profile.bio && (
            <p
              style={{
                margin: "8px 0 0",
                color: "var(--mui-palette-text-secondary)",
                fontSize: "1rem",
              }}
            >
              {profile.bio}
            </p>
          )}
          <p
            style={{
              margin: "8px 0 0",
              fontSize: "0.9rem",
              color: "var(--mui-palette-text-secondary)",
            }}
          >
            {total} composition{total !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Compositions Grid */}
      {compositions.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--mui-palette-text-secondary)" }}>
          No public compositions yet.
        </p>
      ) : (
        <>
          <style>{`
            .profile-comp-card:hover {
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
          `}</style>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 24,
            }}
          >
            {compositions.map((comp) => {
              const viewUrl = `/public/view/${comp.public_magic_id}`;
              const coverUrl = comp.cover_url
                ? `${API_BASE_URL}${comp.cover_url}`
                : null;

              return (
                <a
                  key={comp.id}
                  href={viewUrl}
                  className="profile-comp-card"
                  style={{
                    display: "block",
                    textDecoration: "none",
                    color: "inherit",
                    borderRadius: 12,
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: "var(--mui-palette-divider)",
                    transition: "box-shadow 0.2s",
                  }}
                >
                  {coverUrl && (
                    <img
                      src={coverUrl}
                      alt=""
                      style={{
                        width: "100%",
                        height: 200,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  )}
                  <div style={{ padding: 16 }}>
                    <h3
                      style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}
                    >
                      {comp.name}
                    </h3>
                    {comp.description && (
                      <p
                        style={{
                          margin: "8px 0 0",
                          color: "var(--mui-palette-text-secondary)",
                          fontSize: "0.9rem",
                        }}
                      >
                        {comp.description}
                      </p>
                    )}
                    {comp.published_at && (
                      <p
                        style={{
                          margin: "8px 0 0",
                          fontSize: "0.8rem",
                          color: "var(--mui-palette-text-secondary)",
                        }}
                      >
                        {new Date(comp.published_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </a>
              );
            })}
          </div>

          {/* View More */}
          {hasMore && (
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <button
                onClick={loadMore}
                disabled={loading}
                style={{
                  padding: "10px 32px",
                  fontSize: "0.9rem",
                  borderRadius: 8,
                  border: "1px solid",
                  borderColor: "var(--mui-palette-divider)",
                  background: "var(--mui-palette-background-paper)",
                  color: "var(--mui-palette-text-primary)",
                  cursor: loading ? "default" : "pointer",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Loading..." : "View more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}