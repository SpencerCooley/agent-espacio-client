import { ImageResponse } from "next/og";
import {
  API_BASE_URL,
  getPublicView,
  type PublicViewData,
} from "@/lib/server/api";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TYPE_LABELS: Record<string, string> = {
  folder: "Folder",
  note: "Note",
  workflow: "Workflow",
  map: "Map",
  gallery: "Gallery",
  composer: "Story",
  repo: "Repository",
  image: "Image",
  video: "Video",
  audio: "Audio",
  pdf: "PDF",
  markdown: "Markdown",
  json: "JSON",
  glb: "3D Model",
};

function getTypeLabel(view: PublicViewData): string {
  if (view.kind === "folder") return TYPE_LABELS.folder;
  if (view.kind === "asset") {
    const mime = view.asset?.mime_type || "";
    if (view.asset?.is_image) return TYPE_LABELS.image;
    if (mime.startsWith("video/")) return TYPE_LABELS.video;
    if (mime.startsWith("audio/")) return TYPE_LABELS.audio;
    if (mime === "application/pdf") return TYPE_LABELS.pdf;
    if (mime.includes("markdown")) return TYPE_LABELS.markdown;
    if (mime === "application/json") return TYPE_LABELS.json;
    if (mime === "model/gltf-binary") return TYPE_LABELS.glb;
    return "File";
  }
  return TYPE_LABELS[view.artifact?.type || ""] || "Artifact";
}

function resolveCoverUrl(view: PublicViewData): string | null {
  if (view.kind === "artifact" && view.artifact?.cover_url) {
    return `${API_BASE_URL}${view.artifact.cover_url}`;
  }
  if (view.kind === "asset") {
    const asset = view.asset;
    if (!asset) return null;
    const base = `${API_BASE_URL}/public/assets/${asset.public_magic_id}/download`;
    if (asset.is_image) return `${base}?size=512`;
    const mime = asset.mime_type || "";
    if (mime.startsWith("video/") || mime === "model/gltf-binary") {
      return `${base}?size=512`;
    }
  }
  return null;
}

export default async function Image({
  params,
}: {
  params: Promise<{ magicId: string }>;
}) {
  const { magicId } = await params;

  let view: PublicViewData | null = null;
  try {
    view = await getPublicView(magicId);
  } catch {
    // Fall through to generic card
  }

  const coverUrl = view ? resolveCoverUrl(view) : null;

  if (coverUrl) {
    // Redirect crawlers to the actual image. The target is a public endpoint,
    // so it never expires (assets) or is freshly signed (artifact covers).
    return new Response(null, {
      status: 302,
      headers: { Location: coverUrl },
    });
  }

  const name =
    view?.folder?.name ||
    view?.asset?.name ||
    view?.artifact?.name ||
    "Agent Espacio";
  const typeLabel = view ? getTypeLabel(view) : "Public";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0a0a0a",
          color: "#fff",
          padding: 48,
          fontFamily: "sans-serif",
        }}
      >
        {/* Type chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#1f1f1f",
            color: "#a0a0a0",
            padding: "10px 20px",
            borderRadius: 999,
            fontSize: 22,
            marginBottom: 32,
            alignSelf: "flex-start",
          }}
        >
          {typeLabel}
        </div>

        {/* Name */}
        <div
          style={{
            fontSize: 64,
            lineHeight: 1.15,
            maxWidth: "85%",
            wordBreak: "break-word",
          }}
        >
          {name}
        </div>

        <div style={{ flex: 1 }} />

        {/* Branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: "#444",
            }}
          />
          <span style={{ color: "#666", fontSize: 22 }}>Agent Espacio</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
