import { applyIdePack, fetchIdePack } from "../pack.mjs";
import { remoteMcpUrl, writeMcpConfig } from "../mcp-config.mjs";
import { defaultPackUrl } from "../paths.mjs";

export async function cmdInit(args) {
  const packUrl = args.packUrl || defaultPackUrl();
  console.log(`Fetching Agent Pack…\n  ${packUrl}`);
  const pack = await fetchIdePack(packUrl);
  const { written, meta } = await applyIdePack({
    cwd: args.cwd,
    pack,
    hosts: args.hosts,
    packUrl,
  });

  console.log(`\nInstalled ${pack.package || "@closurenetwork/ide"} @ ${meta.version}`);
  for (const p of written) console.log(`  ${p}`);

  if (!args.noMcp) {
    // Prefer caller STUDIO_URL over pack defaults (local dogfood vs SaaS).
    // MCP URL: pack.mcp.url (platform sets CLOSURE_MCP_PUBLIC_URL) → else
    // remoteMcpUrl(studio) which maps SaaS console → mcp.closureapps.com.
    // Never invent `${studioUrl}/api/mcp` here — that broke Connect when the
    // PRM resource is the dedicated MCP host.
    const studioUrl = process.env.STUDIO_URL || pack.studioUrl;
    const mcp = {
      ...(pack.mcp || {}),
      name: pack.mcp?.name || "closure",
      url:
        process.env.STUDIO_MCP_URL ||
        pack.mcp?.url ||
        remoteMcpUrl(studioUrl),
      type: pack.mcp?.type || "http",
    };
    const path = await writeMcpConfig({
      cwd: args.cwd,
      globalMcp: args.globalMcp,
      stdio: args.stdio,
      studioUrl,
      mcp,
    });
    console.log(`\nMCP config: ${path}`);
    if (!args.stdio && mcp.url) {
      console.log(`  Connect URL: ${mcp.url}`);
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
  4. Later: npx @closurenetwork/ide sync
`
      : `
Next:
  1. Set STUDIO_API_KEY (Account → IDE) in the MCP env
  2. Reload MCP in your IDE
  3. Call platform_status
`,
  );
  if (pack.tip) console.log(`Tip: ${pack.tip}\n`);
  return 0;
}
