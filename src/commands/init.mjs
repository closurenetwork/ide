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
    const entry = mcpEntry();
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

  console.log(`
Next:
  1. Set STUDIO_EMAIL + STUDIO_PASSWORD in the MCP env (STUDIO_URL if not SaaS default)
  2. Reload MCP in your IDE
  3. Call platform_status
`);
  return 0;
}

/** Customer path is always npx. Maintainers: CLOSURE_IDE_LOCAL=1 */
function mcpEntry() {
  const env = {
    STUDIO_URL: process.env.STUDIO_URL || "https://closureapps.com/console",
    STUDIO_EMAIL: process.env.STUDIO_EMAIL || "you@yourcompany.com",
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
