/**
 * Thin Experience projections for IDE inspect (Wave 47).
 * Full graph stays on Studio; MCP returns page tree + props by default.
 */

type AnyRec = Record<string, unknown>;

export type TreeNode = {
  id: string;
  name?: string;
  kind?: string;
  props?: AnyRec;
  children: TreeNode[];
};

function asRec(v: unknown): AnyRec {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as AnyRec) : {};
}

function childIds(data: AnyRec): string[] {
  const raw = data.children;
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

export function projectExperienceTree(opts: {
  orgId?: string;
  slug: string;
  source?: string;
  graph: AnyRec;
  pageRoute?: string;
  studioUrl: string;
}) {
  const experience = asRec(opts.graph.experience);
  const expData = asRec(experience.data);
  const pagesRaw = Array.isArray(opts.graph.pages) ? opts.graph.pages : [];
  const compsRaw = Array.isArray(opts.graph.components)
    ? opts.graph.components
    : [];

  const byId = new Map<string, AnyRec>();
  for (const c of compsRaw) {
    const rec = asRec(c);
    if (typeof rec.id === "string") byId.set(rec.id, rec);
  }

  const pages = pagesRaw.map((p) => {
    const rec = asRec(p);
    const data = asRec(rec.data);
    return {
      id: String(rec.id || ""),
      route: String(data.route || data.path || ""),
      title: String(data.title || rec.name || ""),
      rootComponentId:
        typeof data.rootComponentId === "string" ? data.rootComponentId : null,
    };
  });

  const routeWanted = opts.pageRoute?.trim();
  const page =
    (routeWanted
      ? pages.find((p) => p.route === routeWanted)
      : pages.find((p) => p.id === expData.homePageId) || pages[0]) || null;

  function walk(id: string | null | undefined, depth: number): TreeNode | null {
    if (!id || depth > 24) return null;
    const rec = byId.get(id);
    if (!rec) return { id, children: [] };
    const data = asRec(rec.data);
    const kids = childIds(data)
      .map((cid) => walk(cid, depth + 1))
      .filter((n): n is TreeNode => Boolean(n));
    return {
      id,
      name: typeof rec.name === "string" ? rec.name : undefined,
      kind: typeof data.kind === "string" ? data.kind : undefined,
      props: asRec(data.props),
      children: kids,
    };
  }

  const tree = page?.rootComponentId
    ? walk(page.rootComponentId, 0)
    : null;

  const slug = String(expData.slug || opts.slug);
  return {
    ok: true,
    orgId: opts.orgId,
    slug,
    source: opts.source,
    experience: {
      id: experience.id,
      name: experience.name,
      slug,
      homePageId: expData.homePageId,
      homePath: page?.route || "/",
      nav: expData.nav,
      theme: expData.theme,
    },
    pages,
    page,
    tree,
    openUrl: `${opts.studioUrl.replace(/\/$/, "")}/experiences/${slug}${
      page?.route && page.route !== "/"
        ? `?route=${encodeURIComponent(page.route)}`
        : ""
    }`,
    tip: "Targeted craft: platform_craft_start with componentId + propsPatch. Do not full-rebuild for copy tweaks.",
  };
}
