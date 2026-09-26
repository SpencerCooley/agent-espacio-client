/**
 * Display labels for folder-view filter subtypes (asset kinds and artifact
 * types). Labels are singular — the count next to the label already
 * indicates quantity ("Markdown (3)", not "Markdowns (3)").
 */

const SUBTYPE_LABELS: Record<string, string> = {
  // Asset subtypes
  image: 'Image',
  video: 'Video',
  audio: 'Audio',
  markdown: 'Markdown',
  json: 'JSON',
  pdf: 'PDF',
  '3d': '3D Model',
  other: 'Other',
  // Artifact types (registry display names)
  note: 'Note',
  map: 'Map',
  gallery: 'Gallery',
  workflow: 'Workflow',
  composer: 'Composition',
  repo: 'Repository',
};

/**
 * Resolve a subtype key to its display label. Unknown/future types fall back
 * to a capitalized singular of the key itself.
 */
export function getSubtypeLabel(subtype: string): string {
  return SUBTYPE_LABELS[subtype] ?? subtype.charAt(0).toUpperCase() + subtype.slice(1);
}
