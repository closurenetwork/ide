import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { defaultStudioUrl, mcpBin } from "./paths.mjs";

export function remoteMcpUrl(studioUrl) {
  if (process.env.STUDIO_MCP_URL) {
    return process.env.STUDIO_MCP_URL.replace(/\/$/, "");
  }
  const base = (studioUrl || defaultStudioUrl()).replace(/\/$/, "");
  // SaaS default: dedicated MCP host (no /console path in client config).
  if (base === "https://closureapps.com/console") {
    return "https://mcp.closureapps.com";
  }
  return `${base}/api/mcp`;
}

/**
 * @param {{ stdio?: boolean, studioUrl?: string, mcp?: { name?: string, url?: string, type?: string } }} args
 */
export function mcpEntry(args) {
  const wantStdio =
    Boolean(args.stdio) || process.env.CLOSURE_IDE_STDIO === "1";
  const name = args.mcp?.name || "closure";

  if (!wantStdio) {
    return {
      name,
      entry: {
        url: args.mcp?.url || remoteMcpUrl(args.studioUrl),
        type: args.mcp?.type || "http",
      },
    };
  }

  const env = {
    STUDIO_URL: args.studioUrl || defaultStudioUrl(),
    STUDIO_API_KEY: process.env.STUDIO_API_KEY || "",
    STUDIO_EMAIL: process.env.STUDIO_EMAIL || "",
    STUDIO_PASSWORD: process.env.STUDIO_PASSWORD || "",
  };

  if (process.env.CLOSURE_IDE_LOCAL === "1") {
    return {
      name,
      entry: { command: "node", args: [mcpBin()], env },
    };
  }

  return {
    name,
    entry: {
      command: "npx",
      args: ["-y", "@closurenetwork/ide", "mcp-stdio"],
      env,
    },
  };
}

export async function writeMcpConfig(args) {
  const { name, entry } = mcpEntry(args);
  const path = args.globalMcp
    ? join(homedir(), ".cursor", "mcp.json")
    : join(args.cwd, ".cursor", "mcp.json");
  await mkdir(join(path, ".."), { recursive: true });
  let doc = { mcpServers: {} };
  try {
    doc = JSON.parse(await readFile(path, "utf8"));
  } catch {
    /* new */
  }
  if (!doc.mcpServers || typeof doc.mcpServers !== "object") {
    doc.mcpServers = {};
  }
  doc.mcpServers[name] = entry;
  // Migrate legacy mcp.json key from early kit installs
  if (name === "closure" && doc.mcpServers["closure-platform"]) {
    delete doc.mcpServers["closure-platform"];
  }
  await writeFile(path, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
  return path;
}
