/**
 * Extract plain text from a TipTap/ProseMirror JSON document.
 * Used for JSON-LD articleBody and semantic outlines.
 */
export function extractNoteText(doc: unknown, maxLength = 600): string {
  const parts: string[] = [];

  function walk(nodes: unknown[]) {
    for (const node of nodes) {
      if (typeof node !== "object" || node === null) continue;
      const n = node as Record<string, unknown>;
      if (n.type === "text" && typeof n.text === "string") {
        parts.push(n.text);
      }
      if (Array.isArray(n.content)) {
        walk(n.content);
      }
    }
  }

  if (
    typeof doc === "object" &&
    doc !== null &&
    Array.isArray((doc as Record<string, unknown>).content)
  ) {
    walk((doc as Record<string, unknown>).content as unknown[]);
  }

  const text = parts.join(" ");
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}
