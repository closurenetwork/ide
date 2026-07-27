/**
 * Prefer the product Host for openUrl (gtmsignal.io, …) over the Studio
 * control-plane runner (closureapps.com/console/experiences/…).
 * Agents open this in Cursor's Simple Browser — wrong host looks like a
 * domain "switch" mid-session.
 */

export type ExperienceOpenGraph = {
  theme?: {
    primaryHost?: string;
    domain?: string;
    authExperienceSlug?: string;
  };
  hosts?: string[];
  slug?: string;
};

function normalizeHost(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
}

/** True for Closure control-plane / platform hosts — not customer product DNS. */
export function isControlPlaneHost(host: string): boolean {
  const h = normalizeHost(host);
  if (!h) return true;
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h === "closureapps.com" || h.endsWith(".closureapps.com")) return true;
  if (h === "ingress.closureapps.com") return true;
  return false;
}

/**
 * Pick the best public product hostname from Experience graph data.
 */
export function pickProductHost(graph: ExperienceOpenGraph | null | undefined): string | null {
  if (!graph) return null;
  const theme = graph.theme || {};
  const candidates = [
    theme.primaryHost,
    theme.domain,
    ...(Array.isArray(graph.hosts) ? graph.hosts : []),
  ];
  for (const c of candidates) {
    if (typeof c !== "string" || !c.trim()) continue;
    const h = normalizeHost(c);
    if (!h || isControlPlaneHost(h)) continue;
    return h;
  }
  return null;
}

/**
 * URL to open for preview / dogfood.
 * Product Host when claimed; otherwise Studio runner.
 */
export function experienceOpenUrl(opts: {
  studioUrl: string;
  slug: string;
  graph?: ExperienceOpenGraph | null;
  /** In-app route (product host uses clean path; Studio uses ?route=). */
  route?: string;
}): string {
  const studio = opts.studioUrl.replace(/\/$/, "");
  const route =
    opts.route && opts.route !== "/"
      ? opts.route.startsWith("/")
        ? opts.route
        : `/${opts.route}`
      : "/";
  const host = pickProductHost(opts.graph);
  if (host) {
    return route === "/" ? `https://${host}/` : `https://${host}${route}`;
  }
  const q =
    route !== "/" ? `?route=${encodeURIComponent(route)}` : "";
  return `${studio}/experiences/${encodeURIComponent(opts.slug)}${q}`;
}
