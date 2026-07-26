import { cmdInit } from "./commands/init.mjs";
import { cmdSync } from "./commands/sync.mjs";
import { cmdUpdate } from "./commands/update.mjs";
import { cmdStatus } from "./commands/status.mjs";
import { cmdDoctor } from "./commands/doctor.mjs";
import { pkgRoot } from "./paths.mjs";

const HELP = `
@closurenetwork/ide — Closure Agent Pack

  npx @closurenetwork/ide init      # fetch pack + write rails + register MCP
  npx @closurenetwork/ide sync      # re-fetch pack from Platform Knowledge
  npx @closurenetwork/ide status    # local + remote pack health
  npx @closurenetwork/ide doctor    # alias of status
  npx @closurenetwork/ide update    # alias of sync

Options:
  --cwd <path>      target directory (default: .)
  --global-mcp      write ~/.cursor/mcp.json
  --no-mcp          rails only
  --stdio           write stdio MCP entry instead of remote url
  --hosts <list>    cursor,claude,agents,copilot

Env:
  STUDIO_URL / CLOSURE_STUDIO_URL   console base (default SaaS)
  CLOSURE_IDE_PACK_URL              override GET …/api/public/ide/pack
  STUDIO_MCP_URL                    override MCP Connect URL
  STUDIO_API_KEY                    stdio Bearer fallback
`.trim();

export async function runCli(argv) {
  const [cmd = "help", ...rest] = argv;
  const args = parseArgs(rest);

  switch (cmd) {
    case "init":
      return cmdInit(args);
    case "sync":
      return cmdSync(args);
    case "update":
      return cmdUpdate(args);
    case "status":
      return cmdStatus(args);
    case "doctor":
      return cmdDoctor(args);
    case "mcp":
      console.log(`Preferred: remote URL in mcp.json (Cursor Connect).

  { "mcpServers": { "closure": { "url": "https://mcp.closureapps.com", "type": "http" } } }

Stdio fallback: npx -y @closurenetwork/ide mcp-stdio
`);
      return 0;
    case "mcp-stdio": {
      await import(`${pkgRoot()}/mcp/bin/platform-mcp.mjs`);
      return 0;
    }
    case "help":
    case "--help":
    case "-h":
      console.log(HELP);
      return 0;
    default:
      console.error(`Unknown command: ${cmd}\n`);
      console.log(HELP);
      return 1;
  }
}

function parseArgs(rest) {
  const out = {
    cwd: process.cwd(),
    globalMcp: false,
    noMcp: false,
    stdio: false,
    hosts: ["cursor", "claude", "agents", "copilot"],
    packUrl: undefined,
  };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--cwd") out.cwd = rest[++i];
    else if (a === "--global-mcp") out.globalMcp = true;
    else if (a === "--no-mcp") out.noMcp = true;
    else if (a === "--stdio") out.stdio = true;
    else if (a === "--pack-url") out.packUrl = rest[++i];
    else if (a === "--hosts") {
      out.hosts = String(rest[++i] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return out;
}
