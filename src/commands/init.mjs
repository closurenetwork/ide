import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { exportDoctrine } from "../export-doctrine.mjs";
import { mcpBin } from "../paths.mjs";

export async function cmdInit(args) {
  const written = await exportDoctrine(args);
  console.log("Installed Closure IDE rails:");
  for (const p of written) console.log(`  ${p}`);

  if (!args.noMcp) {
    const entry = mcpEntry(args);
    if (args.globalMcp) {
      const path = join(homedir(), ".cursor", "mcp.json");
      await mergeMcpJson(path, entry);
      console.log(`\nMCP config: ${path}`);
    } else {
      const path = join(args.cwd, ".cursor", "mcp.json");
      await mergeMcpJson(path, entry);
      console.log(`\nMCP config: ${path}`);
    }
  }

  const remote = !args.stdio;
  console.log(
    remote
      ? `
Next:
  1. Reload MCP in Cursor — click Connect when prompted
  2. Sign in / Allow in the browser
  3. Call platform_status → platform_knowledge_skills_pull
`
      : `
Next:
  1. Set STUDIO_API_KEY (Account → IDE) in the MCP env — or STUDIO_EMAIL + STUDIO_PASSWORD
  2. Reload MCP in your IDE
  3. Call platform_status
`,
  );
  return 0;
}

function remoteMcpUrl() {
  if (process.env.STUDIO_MCP_URL) {
    return process.env.STUDIO_MCP_URL.replace(/\/$/, "");
  }
  const base = (
    process.env.STUDIO_URL || "https://closureapps.com/console"
  ).replace(/\/$/, "");
  return `${base}/api/mcp`;
}

/**
 * Default: remote URL (Cursor Connect / OAuth).
 * `--stdio` or CLOSURE_IDE_STDIO=1 → local process + env auth.
 * CLOSURE_IDE_LOCAL=1 → node path to local mcp bin (maintainers).
 */
function mcpEntry(args) {
  const wantStdio =
    Boolean(args.stdio) || process.env.CLOSURE_IDE_STDIO === "1";

  if (!wantStdio) {
    // Match Cursor/Figma remote shape — `type: "http"` is what surfaces Connect.
    return { url: remoteMcpUrl(), type: "http" };
  }

  const env = {
    STUDIO_URL: process.env.STUDIO_URL || "https://closureapps.com/console",
    STUDIO_API_KEY: process.env.STUDIO_API_KEY || "",
    STUDIO_EMAIL: process.env.STUDIO_EMAIL || "",
    STUDIO_PASSWORD: process.env.STUDIO_PASSWORD || "",
  };

  if (process.env.CLOSURE_IDE_LOCAL === "1") {
    return {
      command: "node",
      args: [mcpBin()],
      env,
    };
  }

  return {
    command: "npx",
    args: ["-y", "@closure-platform/ide", "mcp-stdio"],
    env,
  };
}

async function mergeMcpJson(path, entry) {
  await mkdir(join(path, ".."), { recursive: true });
  let doc = { mcpServers: {} };
  try {
    doc = JSON.parse(await readFile(path, "utf8"));
  } catch {
    /* new file */
  }
  if (!doc.mcpServers || typeof doc.mcpServers !== "object") {
    doc.mcpServers = {};
  }
  doc.mcpServers["closure-platform"] = entry;
  await writeFile(path, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
}
