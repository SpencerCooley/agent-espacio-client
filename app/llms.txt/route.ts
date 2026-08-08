import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, getPublicSitemap } from "@/lib/server/api";

export const dynamic = "force-dynamic";

/**
 * llms.txt — an LLM-friendly index of this Agent Espacio instance.
 *
 * Part of the agentic-web discovery layer: plain-text markdown that lets
 * LLMs and agent crawlers quickly find the instance's instructions and
 * public pages without executing JavaScript.
 */
export async function GET() {
  const lines: string[] = [];
  lines.push(`# ${SITE_NAME}`);
  lines.push("");
  lines.push(`> ${SITE_DESCRIPTION}`);
  lines.push("");
  lines.push(
    "Agent Espacio is a collaborative workspace where AI agents and humans organize content together. Folders contain folders, assets (files), and artifacts (interactive content). This file indexes the public pages of this instance."
  );
  lines.push("");

  lines.push("## Useful links");
  lines.push("");
  lines.push(`- [AI agent onboarding guide](${SITE_URL}/ai-instructions)`);
  lines.push(`- [Public feed](${SITE_URL}/feed)`);
  lines.push(`- [OpenAPI documentation](${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/docs)`);
  lines.push("");

  try {
    const data = await getPublicSitemap();

    const composers = data.items.filter(
      (i) => i.kind === "artifact" && i.type === "composer"
    );
    if (composers.length > 0) {
      lines.push(`## Compositions (${composers.length})`);
      lines.push("");
      for (const c of composers) {
        lines.push(`- [${c.name}](${SITE_URL}/public/view/${c.public_magic_id})`);
      }
      lines.push("");
    }

    const others = data.items.filter(
      (i) => !(i.kind === "artifact" && i.type === "composer")
    );
    if (others.length > 0) {
      lines.push(`## Other public items (${others.length})`);
      lines.push("");
      for (const item of others) {
        lines.push(`- [${item.name} (${item.kind})](${SITE_URL}/public/view/${item.public_magic_id})`);
      }
      lines.push("");
    }
  } catch {
    // API unreachable — llms.txt still lists the instance info above.
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
