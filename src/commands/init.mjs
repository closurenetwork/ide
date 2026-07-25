import { applyIdePack, fetchIdePack } from "../pack.mjs";
import { writeMcpConfig } from "../mcp-config.mjs";
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

  console.log(`\nInstalled ${pack.package || "@closure/ide"} @ ${meta.version}`);
  for (const p of written) console.log(`  ${p}`);

  if (!args.noMcp) {
    const path = await writeMcpConfig({
      cwd: args.cwd,
      globalMcp: args.globalMcp,
      stdio: args.stdio,
      studioUrl: pack.studioUrl,
      mcp: pack.mcp,
    });
    console.log(`\nMCP config: ${path}`);
  }

  const remote = !args.stdio;
  console.log(
    remote
      ? `
Next:
  1. Reload MCP in Cursor — click Connect when prompted
  2. Sign in / Allow in the browser
  3. Call platform_status → platform_knowledge_skills_pull
  4. Later: npx @closure/ide sync
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
