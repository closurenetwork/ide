import { cmdInit } from "./commands/init.mjs";
import { cmdUpdate } from "./commands/update.mjs";
import { cmdDoctor } from "./commands/doctor.mjs";
import { cmdExport } from "./commands/export.mjs";
import { pkgRoot } from "./paths.mjs";

const HELP = `
@closure-platform/ide

  npx @closure-platform/ide init     # one-time setup (remote Connect by default)
  npx @closure-platform/ide update   # refresh rails
  npx @closure-platform/ide doctor   # check setup

Options:
  --cwd <path>      target directory (default: .)
  --global-mcp      write ~/.cursor/mcp.json
  --no-mcp          rails only
  --stdio           write stdio MCP entry instead of remote url
  --hosts <list>    cursor,claude,agents

Env:
  STUDIO_MCP_URL / STUDIO_URL   remote Connect (default SaaS console /api/mcp)
  STUDIO_API_KEY                stdio Bearer fallback
  STUDIO_EMAIL / STUDIO_PASSWORD  legacy stdio login
`.trim();

export async function runCli(argv) {
  const [cmd = "help", ...rest] = argv;
  const args = parseArgs(rest);

  switch (cmd) {
    case "init":
      return cmdInit(args);
    case "update":
      return cmdUpdate(args);
    case "export":
      return cmdExport(args);
    case "doctor":
      return cmdDoctor(args);
    case "mcp":
      console.log(`Preferred: remote URL in mcp.json (Cursor Connect).

  { "mcpServers": { "closure-platform": { "url": "https://closureapps.com/console/api/mcp" } } }

Stdio fallback: npx -y @closure-platform/ide mcp-stdio
init writes the remote entry by default (\`init --stdio\` for local process).
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
    hosts: ["cursor", "claude", "agents"],
  };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--cwd") out.cwd = rest[++i];
    else if (a === "--global-mcp") out.globalMcp = true;
    else if (a === "--no-mcp") out.noMcp = true;
    else if (a === "--stdio") out.stdio = true;
    else if (a === "--hosts") {
      out.hosts = String(rest[++i] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return out;
}
