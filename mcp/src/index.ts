import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { StudioClient } from "./studio-client.js";

/**
 * Closure Platform IDE MCP (stdio).
 *
 * Tools (see docs/IDE-CONTROL-PLANE.md):
 *   platform_status
 *   platform_knowledge_skills_pull
 *   platform_experience_scaffold
 *   platform_collect_start
 *   platform_build_start
 *   platform_workflows_list
 *   platform_agent_task
 *   platform_agent_submit
 *
 * Auth: STUDIO_URL + STUDIO_EMAIL + STUDIO_PASSWORD → session cookie.
 * Keep L1 closure-kit MCP separate for gateway DataObjects.
 * After source changes: `pnpm --filter @closure-platform/mcp-server build` then reload MCP in Cursor.
 */

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function asJson(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

function asError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return {
    isError: true as const,
    content: [{ type: "text" as const, text: JSON.stringify({ error: message }, null, 2) }],
  };
}

function client(): StudioClient {
  // Shared across tool calls — org switch from platform_build_start must stick.
  return StudioClient.sharedFromEnv();
}

/** Bundled Closure-way skills shipped with the MCP package. */
const BUNDLED_SKILLS: { id: string; name: string; content: string }[] = [
  {
    id: "closure-way-graph",
    name: "Closure way — semantic graph",
    content: `# Closure way — semantic graph

You are building on **Closure Platform**. Prefer Platform MCP tools (\`platform_*\`) over inventing local JSON or editing Experience TypeScript.

## Rules
1. Experiences, pages, components are **DataObjects** — not \`packages/experiences/src/*-experience.ts\` as SoT.
2. Use \`platform_experience_scaffold\` / \`platform_build_start\`; mutate via \`platform_agent_task\` / \`platform_agent_submit\` or graph APIs.
3. **Forbidden as product path:** hand-editing Experience \`.ts\` to add pages/copy. Pack TS is bootstrap only.
4. Prefer targeted craft over full rebuilds once an Experience exists.
5. After UI changes, open \`/experiences/{slug}\` — confirm the graph, not only chat text.
6. Never paste secrets into chat — call \`platform_collect_start\`.
`,
  },
  {
    id: "closure-way-forms",
    name: "Closure way — forms & secrets",
    content: `# Closure way — forms & secrets

## Rules
1. Sensitive collect uses **Platform Forms** (embed / assistant mode) with vault seal.
2. \`platform_collect_start\` returns a \`collectUrl\` — tell the user to complete it in the browser.
3. You only receive sealed handles / run status afterward — never ask the user to paste passwords into chat.
4. Field types follow collect schema: boolean → checkbox, enum → select, etc. Do not reinvent Form.io as runtime.
`,
  },
  {
    id: "closure-way-ide-agent",
    name: "Closure way — IDE as agent host",
    content: `# Closure way — IDE as agent host

## Rules
1. Your IDE model does **reasoning**; Closure owns **persistence, validation, audit, vault**.
2. Do not burn Platform LLM keys for authoring when local tools can do the work.
3. Prefer structured upserts / scaffold / craft loops over freeform prose that claims the app was built.
4. L1 \`closure.*\` MCP is for gateway JSON-LD. Closure Platform uses \`platform_*\`.
5. Product mutations go through Platform MCP / graph APIs — not Experience pack \`.ts\`.
6. On \`waiting_ide\`, loop task → work → submit until completed / HITL.
7. Secrets: \`platform_collect_start\` only.
`,
  },
];

async function main(): Promise<void> {
  const server = new McpServer(
    { name: "closure-platform-mcp", version: "0.1.0" },
    {
      capabilities: { tools: {}, logging: {} },
      instructions:
        "Closure Platform IDE MCP. Use platform_* tools against Closure SaaS by default (STUDIO_URL=https://closureapps.com/console). After Experience scaffolds, open /experiences/{slug} on that host. For secrets, use platform_collect_start — never collect secrets in chat. L1 closure-kit MCP (closure.*) is a different server.",
    },
  );

  server.registerTool(
    "platform_status",
    {
      title: "Closure status",
      description:
        "Login to Closure and return session identity (email, org, plan). Use as a health check before other platform_* tools.",
      inputSchema: {},
    },
    async () => {
      try {
        const api = client();
        const { ok, status, json } = await api.api<Record<string, unknown>>(
          "/api/auth/me",
        );
        if (!ok) {
          return asJson({ ok: false, status, error: json });
        }
        return asJson({
          ok: true,
          studioUrl: api.baseUrl,
          email: json.email,
          name: json.name,
          org: json.org,
          orgId: json.orgId,
          role: json.role,
          plan: json.plan,
          controlPlane: "closure-platform-mcp",
          docs: "docs/IDE-CONTROL-PLANE.md",
        });
      } catch (e) {
        return asError(e);
      }
    },
  );

  server.registerTool(
    "platform_knowledge_skills_pull",
    {
      title: "Pull Knowledge skills",
      description:
        "Fetch org Knowledge skills from Closure and optionally write Closure-way skill packs to disk for Cursor/Claude. Returns skill list + write paths.",
      inputSchema: {
        writeDir: z
          .string()
          .optional()
          .describe(
            "Directory to write .md skills (default: .cursor/skills/closure-platform under cwd, or PLATFORM_SKILLS_DIR)",
          ),
        includeBundled: z
          .boolean()
          .optional()
          .default(true)
          .describe("Also write bundled Closure-way doctrine skills"),
        query: z
          .string()
          .optional()
          .describe("Optional search query preferring skills"),
      },
    },
    async (args) => {
      try {
        const api = client();
        const { ok, status, json } = await api.api<{
          sources?: Array<{
            id: string;
            name: string;
            role?: string;
            libraryId?: string;
          }>;
          libraries?: unknown[];
        }>("/api/knowledge");
        if (!ok) return asJson({ ok: false, status, error: json });

        const skills = (json.sources || []).filter((s) => s.role === "skill");
        let searchHits: unknown[] = [];
        if (args.query?.trim()) {
          const s = await api.api<{ hits?: unknown[] }>("/api/knowledge/search", {
            method: "POST",
            body: JSON.stringify({
              query: args.query,
              preferSkills: true,
            }),
          });
          if (s.ok) searchHits = s.json.hits || [];
        }

        // Load skill bodies when listing detail one-by-one (cap)
        const detailed: Array<{
          id: string;
          name: string;
          content?: string;
        }> = [];
        for (const s of skills.slice(0, 24)) {
          const d = await api.api<{ source?: { id: string; name: string; content?: string } }>(
            `/api/knowledge?sourceId=${encodeURIComponent(s.id)}`,
          );
          if (d.ok && d.json.source) {
            detailed.push({
              id: d.json.source.id,
              name: d.json.source.name,
              content: d.json.source.content,
            });
          } else {
            detailed.push({ id: s.id, name: s.name });
          }
        }

        const writeDir =
          args.writeDir ||
          process.env.PLATFORM_SKILLS_DIR ||
          join(process.cwd(), ".cursor", "skills", "closure-platform");

        const written: string[] = [];
        const includeBundled = args.includeBundled !== false;
        await mkdir(writeDir, { recursive: true });

        if (includeBundled) {
          for (const b of BUNDLED_SKILLS) {
            const path = join(writeDir, `${b.id}.md`);
            await writeFile(path, b.content, "utf8");
            written.push(path);
          }
        }

        for (const s of detailed) {
          if (!s.content) continue;
          const safe = s.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 64);
          const path = join(writeDir, `org-${safe}.md`);
          const body = `# ${s.name}\n\n_Source: Closure Knowledge skill \`${s.id}\`_\n\n${s.content}\n`;
          await writeFile(path, body, "utf8");
          written.push(path);
        }

        // Always ensure package skills mirror exists for reference
        const bundledDir = join(PKG_ROOT, "skills");
        await mkdir(bundledDir, { recursive: true });
        for (const b of BUNDLED_SKILLS) {
          await writeFile(join(bundledDir, `${b.id}.md`), b.content, "utf8");
        }

        return asJson({
          ok: true,
          studioUrl: api.baseUrl,
          skillCount: skills.length,
          skills: detailed.map((s) => ({
            id: s.id,
            name: s.name,
            chars: s.content?.length ?? 0,
          })),
          searchHits,
          writeDir,
          written,
          tip: "Point Cursor Agent Skills at writeDir, or keep using these files as doctrine while calling platform_* tools.",
        });
      } catch (e) {
        return asError(e);
      }
    },
  );

  server.registerTool(
    "platform_experience_scaffold",
    {
      title: "Scaffold Experience",
      description:
        "Scaffold a Closure Experience (pages/components as DataObjects) via Closure IDE API. Prefer a clear name and surface (marketing|console). Fast path — no chat elicitation / full vertical build.",
      inputSchema: {
        name: z
          .string()
          .min(2)
          .describe("Experience display name, e.g. Meridian Member Portal"),
        brief: z
          .string()
          .optional()
          .describe("Optional extra product brief for the scaffold"),
        surface: z
          .enum(["marketing", "console"])
          .optional()
          .default("console")
          .describe("Theme surface hint"),
      },
    },
    async (args) => {
      try {
        const api = client();
        const { ok, status, json } = await api.api<Record<string, unknown>>(
          "/api/ide/experience/scaffold",
          {
            method: "POST",
            body: JSON.stringify({
              name: args.name,
              brief: args.brief,
              surface: args.surface || "console",
            }),
          },
        );

        if (!ok) return asJson({ ok: false, status, error: json });

        const slug = json.experienceSlug as string | undefined;
        return asJson({
          ok: true,
          experienceId: json.experienceId,
          experienceSlug: slug,
          experienceName: json.experienceName,
          openUrl: slug
            ? `${api.baseUrl}/experiences/${slug}`
            : `${api.baseUrl}/experiences`,
          result: json.result,
          tip: "Open openUrl in the browser. Next: add pages/workflows via Assistant or graph tools; secrets via platform_collect_start.",
        });
      } catch (e) {
        return asError(e);
      }
    },
  );

  server.registerTool(
    "platform_collect_start",
    {
      title: "Start collect (microform)",
      description:
        "Start a governed Platform Form collect for sensitive data. Returns a collectUrl the USER must open in a browser. Never ask for secrets in chat. Optionally lists workflows if workflowId omitted.",
      inputSchema: {
        workflowId: z
          .string()
          .optional()
          .describe(
            "Workflow graph id with collect nodes (e.g. connector connect flow). If omitted, returns candidate workflows.",
          ),
        mode: z
          .enum(["embed", "assistant", "wizard", "monolith"])
          .optional()
          .default("assistant")
          .describe("Form projection mode for the embed"),
      },
    },
    async (args) => {
      try {
        const api = client();
        const { ok, status, json } = await api.api<{
          workflows?: Array<{ id: string; name: string; kind?: string }>;
        }>("/api/workflows");

        if (!ok) return asJson({ ok: false, status, error: json });

        const workflows = json.workflows || [];
        const workflowId = args.workflowId?.trim();

        if (!workflowId) {
          return asJson({
            ok: true,
            needsWorkflowId: true,
            candidates: workflows.slice(0, 40).map((w) => ({
              id: w.id,
              name: w.name,
              kind: w.kind,
            })),
            tip: "Pick a workflowId that collects credentials/config, then call platform_collect_start again. User completes the form in the browser — you never see secrets.",
          });
        }

        const mode = args.mode || "assistant";
        const collectUrl = `${api.baseUrl}/embed/${encodeURIComponent(workflowId)}?mode=${encodeURIComponent(mode)}`;
        const previewUrl = `${api.baseUrl}/preview?wf=${encodeURIComponent(workflowId)}`;

        // Soft-start a run so Closure has an audit trail when submit happens from embed
        let runId: string | undefined;
        const start = await api.api<{ runId?: string; id?: string }>(
          "/api/runs",
          {
            method: "POST",
            body: JSON.stringify({ workflowId }),
          },
        );
        if (start.ok) {
          runId = start.json.runId || start.json.id;
        }

        return asJson({
          ok: true,
          workflowId,
          collectUrl,
          previewUrl,
          runId: runId || null,
          instructions: [
            "Open collectUrl in the IDE Simple Browser or the user's default browser.",
            "User completes the Platform Form (vaulted fields).",
            "Do not ask the user to paste secrets into chat.",
            "After completion, check Closure runs / connector status — you only get sealed handles.",
          ],
        });
      } catch (e) {
        return asError(e);
      }
    },
  );

  server.registerTool(
    "platform_build_start",
    {
      title: "Start governed build program",
      description:
        "Start wf-build (or wf-build-experience) via the IDE control plane. Uses deterministic platform tools when no Platform LLM key is set — safe for Cursor smoke without Claude credits. Prefer orgId=org_closure for platform workflows. Pass a large briefPaste/message for multi-surface products.",
      inputSchema: {
        message: z
          .string()
          .optional()
          .describe("Product brief or large paste"),
        brand: z.string().optional().describe("Brand name override"),
        industry: z.string().optional(),
        surfaces: z.string().optional(),
        journeys: z.string().optional(),
        orgId: z
          .string()
          .optional()
          .describe("Switch session org first (default: current)"),
        workflowId: z
          .enum([
            "wf-build",
            "wf-build-experience",
            "wf-build-intake",
            "wf-build-knowledge",
            "wf-build-workflows",
            "wf-build-integrations",
          ])
          .optional()
          .describe("Default: auto (wf-build for large briefs)"),
        autoApprove: z
          .boolean()
          .optional()
          .default(true)
          .describe("Auto-approve HITL gates (default true for IDE smoke)"),
      },
    },
    async (args) => {
      try {
        const api = client();
        if (args.orgId) {
          await api.api("/api/auth/orgs", {
            method: "POST",
            body: JSON.stringify({ orgId: args.orgId }),
          });
        }
        const brief = args.brand
          ? {
              brand: args.brand,
              industry: args.industry || "Other",
              surfaces: args.surfaces || "Marketing + portal",
              journeys: args.journeys || "intake, support, assistant",
              briefPaste: args.message,
              notes: args.message?.slice(0, 400),
            }
          : undefined;
        const { ok, status, json } = await api.api<Record<string, unknown>>(
          "/api/ide/build/start",
          {
            method: "POST",
            body: JSON.stringify({
              message: args.message,
              brief,
              workflowId: args.workflowId,
              orgId: args.orgId,
              autoApprove: args.autoApprove !== false,
            }),
          },
        );
        if (!ok) return asJson({ ok: false, status, error: json });
        return asJson({
          ok: true,
          ...json,
          tip: "Inspect run in Closure Workflows → Runs. Open portalSlug/marketingSlug under Experiences when present.",
        });
      } catch (e) {
        return asError(e);
      }
    },
  );

  server.registerTool(
    "platform_workflows_list",
    {
      title: "List org workflows",
      description:
        "List workflows visible for the current (or switched) org. Use to verify platform org filtering — org_closure should only show Platform domain / build program graphs.",
      inputSchema: {
        orgId: z.string().optional().describe("Switch org before listing"),
      },
    },
    async (args) => {
      try {
        const api = client();
        if (args.orgId) {
          await api.api("/api/auth/orgs", {
            method: "POST",
            body: JSON.stringify({ orgId: args.orgId }),
          });
        }
        const { ok, status, json } = await api.api<{
          orgId?: string;
          workflows?: Array<{
            id: string;
            name: string;
            domain?: string;
            kind?: string;
          }>;
        }>("/api/workflows");
        if (!ok) return asJson({ ok: false, status, error: json });
        const workflows = json.workflows || [];
        return asJson({
          ok: true,
          orgId: json.orgId,
          count: workflows.length,
          workflows: workflows.map((w) => ({
            id: w.id,
            name: w.name,
            domain: w.domain,
            kind: w.kind,
          })),
          buildProgram: workflows
            .filter((w) => w.id.startsWith("wf-build"))
            .map((w) => w.id),
        });
      } catch (e) {
        return asError(e);
      }
    },
  );

  server.registerTool(
    "platform_agent_task",
    {
      title: "IDE agent task",
      description:
        "Fetch the current workflow agent task when a run is waiting_ide (or any run status). Use after platform_build_start / platform_agent_advance when CLOSURE_AGENT_EXECUTOR=ide on Studio.",
      inputSchema: {
        runId: z.string().describe("Workflow run id"),
        orgId: z
          .string()
          .optional()
          .describe("Switch org before fetch (use org_closure for platform builds)"),
      },
    },
    async (args) => {
      try {
        const api = client();
        if (args.orgId) await api.switchOrg(args.orgId);
        else await api.switchOrg("org_closure").catch(() => undefined);
        const { ok, status, json } = await api.api(
          `/api/ide/agent/task?runId=${encodeURIComponent(args.runId)}`,
        );
        if (!ok) return asJson({ ok: false, status, error: json });
        return asJson(json);
      } catch (e) {
        return asError(e);
      }
    },
  );

  server.registerTool(
    "platform_agent_submit",
    {
      title: "IDE agent submit + advance",
      description:
        "Complete a waiting_ide agent node (summary + optional runPatch) and advance. Default maxSteps=12 keeps going until the next waiting_ide / waiting_human / completed — IDE agents should loop task→submit without stopping. Pass orgId=org_closure for platform builds. Local Studio needs CLOSURE_AGENT_EXECUTOR=ide.",
      inputSchema: {
        runId: z.string(),
        orgId: z
          .string()
          .optional()
          .describe("Switch org before submit (use org_closure for platform builds)"),
        summary: z
          .string()
          .optional()
          .describe("What the IDE agent did for this node"),
        confidence: z.number().min(0).max(1).optional(),
        runPatch: z
          .record(z.unknown())
          .optional()
          .describe("Merge into run data (plans, slugs, flags)"),
        branch: z.string().optional(),
        fields: z.record(z.unknown()).optional(),
        maxSteps: z
          .number()
          .int()
          .min(1)
          .max(40)
          .optional()
          .describe("Advance up to N steps after submit (default 12 — continuous IDE loop)"),
        forceHosted: z
          .boolean()
          .optional()
          .describe("Force hosted LLM for this advance (skip IDE pause)"),
      },
    },
    async (args) => {
      try {
        const api = client();
        if (args.orgId) await api.switchOrg(args.orgId);
        else await api.switchOrg("org_closure").catch(() => undefined);
        const { ok, status, json } = await api.api("/api/ide/agent/task", {
          method: "PUT",
          body: JSON.stringify({
            runId: args.runId,
            summary: args.summary,
            confidence: args.confidence,
            runPatch: args.runPatch,
            branch: args.branch,
            fields: args.fields,
            maxSteps: args.maxSteps ?? 12,
            forceHosted: args.forceHosted,
          }),
        });
        if (!ok) return asJson({ ok: false, status, error: json });
        const st =
          typeof json === "object" && json && "status" in json
            ? String((json as { status?: string }).status || "")
            : "";
        const waitingIde = st === "waiting_ide";
        return asJson({
          ok: true,
          ...(typeof json === "object" && json ? json : { result: json }),
          waitingIde,
          tip: waitingIde
            ? "Still waiting_ide — call platform_agent_task, do the node work, platform_agent_submit again (keep looping)."
            : st === "completed"
              ? "Run completed — open Experiences / Runs in the console."
              : "Advanced — poll platform_agent_task if status is unclear.",
        });
      } catch (e) {
        return asError(e);
      }
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
