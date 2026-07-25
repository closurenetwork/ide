/**
 * Thin Closure HTTP client — cookie session (smoke pattern).
 * Not L1 cwk_ Bearer; Closure has no machine API keys yet.
 */

export type StudioConfig = {
  baseUrl: string;
  email: string;
  password: string;
};

export class StudioClient {
  readonly baseUrl: string;
  private readonly email: string;
  private readonly password: string;
  private cookie: string | null = null;

  constructor(cfg: StudioConfig) {
    this.baseUrl = cfg.baseUrl.replace(/\/$/, "");
    this.email = cfg.email;
    this.password = cfg.password;
  }

  static fromEnv(): StudioClient {
    return new StudioClient({
      baseUrl: process.env.STUDIO_URL || "http://localhost:3021",
      email: process.env.STUDIO_EMAIL || "demo@closure.ai",
      password: process.env.STUDIO_PASSWORD || "closure",
    });
  }

  /** Process-wide client so org switches persist across MCP tool calls. */
  static sharedFromEnv(): StudioClient {
    const g = globalThis as typeof globalThis & {
      __closurePlatformMcpClient?: StudioClient;
    };
    if (!g.__closurePlatformMcpClient) {
      g.__closurePlatformMcpClient = StudioClient.fromEnv();
    }
    return g.__closurePlatformMcpClient;
  }

  async switchOrg(orgId: string): Promise<void> {
    const { ok, status, json } = await this.api("/api/auth/orgs", {
      method: "POST",
      body: JSON.stringify({ orgId }),
    });
    if (!ok) {
      throw new Error(
        `studio_org_switch_failed ${status} ${JSON.stringify(json)}`,
      );
    }
  }

  /** Pin session org when the tool caller passes orgId. */
  async pinOrg(orgId?: string): Promise<string | undefined> {
    if (!orgId) return undefined;
    await this.switchOrg(orgId);
    return orgId;
  }

  async getExperience(slug: string) {
    return this.api<Record<string, unknown>>(
      `/api/experience/${encodeURIComponent(slug)}`,
    );
  }

  async getObject(id: string) {
    return this.api<{ ok?: boolean; object?: Record<string, unknown>; error?: string }>(
      `/api/graph/objects/${encodeURIComponent(id)}`,
    );
  }

  async putObject(id: string, body: Record<string, unknown>) {
    return this.api<{ ok?: boolean; object?: Record<string, unknown>; error?: string }>(
      `/api/graph/objects/${encodeURIComponent(id)}`,
      { method: "PUT", body: JSON.stringify(body) },
    );
  }

  async ensureSession(): Promise<void> {
    if (this.cookie) return;
    const res = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: this.email, password: this.password }),
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      throw new Error(
        `studio_login_failed ${res.status} ${JSON.stringify(body)}`,
      );
    }
    this.cookie = cookieFromLogin(res);
    if (!this.cookie.includes("closure_studio_session")) {
      throw new Error(
        `studio_login_ok_but_no_session_cookie set-cookie=${res.headers.get("set-cookie")}`,
      );
    }
  }

  async api<T = unknown>(
    path: string,
    init: RequestInit = {},
  ): Promise<{ ok: boolean; status: number; json: T }> {
    await this.ensureSession();
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Cookie: this.cookie!,
        ...(init.headers || {}),
      },
    });
    const json = (await res.json().catch(() => ({}))) as T;
    if (res.status === 401) {
      this.cookie = null;
      await this.ensureSession();
      const retry = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Cookie: this.cookie!,
          ...(init.headers || {}),
        },
      });
      const retryJson = (await retry.json().catch(() => ({}))) as T;
      return { ok: retry.ok, status: retry.status, json: retryJson };
    }
    return { ok: res.ok, status: res.status, json };
  }
}

function cookieFromLogin(res: Response): string {
  const anyHeaders = res.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const raw = anyHeaders.getSetCookie?.() || [];
  if (raw.length) {
    return raw.map((c) => c.split(";")[0]!).join("; ");
  }
  const single = res.headers.get("set-cookie");
  if (!single) return "";
  return single
    .split(/,(?=[^;]+?=)/)
    .map((c) => c.split(";")[0]!.trim())
    .join("; ");
}
