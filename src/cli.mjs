import { cmdInit } from "./commands/init.mjs";
import { cmdUpdate } from "./commands/update.mjs";
import { cmdDoctor } from "./commands/doctor.mjs";
import { cmdExport } from "./commands/export.mjs";
import { pkgRoot } from "./paths.mjs";

const HELP = `
@closure-platform/ide — Closure Platform IDE kit

Usage:
  npx @closure-platform/ide <command> [options]

Commands:
  init      Install MCP snippet + project doctrine into the current repo
  update    Refresh doctrine files from this package (keeps MCP config)
  export    Write host adapters only (cursor | claude | agents | all)
  doctor    Check MCP binary, doctrine files, and optional platform_status
  mcp       Print how to run the Platform MCP server
  help      Show this help

Options (init / update / export):
  --cwd <path>         Target directory (default: process.cwd())
  --global-mcp         Merge MCP entry into ~/.cursor/mcp.json
  --no-mcp             Skip MCP config writes
  --hosts <list>       comma list: cursor,claude,agents (default: all)

Env for doctor / MCP:
  STUDIO_URL           Closure console origin (default https://closureapps.com/console)
  STUDIO_EMAIL         Session email (spike auth)
  STUDIO_PASSWORD      Session password (spike auth)
  CLOSURE_API_KEY      Preferred when Platform API keys land

Package root: ${pkgRoot()}
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
      console.log(`Run Platform MCP (stdio):

  node ${pkgRoot()}/mcp/bin/platform-mcp.mjs

Or after npm link / publish:

  npx @closure-platform/ide mcp-stdio
  # bin alias: platform-mcp

Cursor mcp.json entry:

  "closure-platform": {
    "command": "npx",
    "args": ["-y", "@closure-platform/ide", "mcp-stdio"],
    "env": {
      "STUDIO_URL": "https://closureapps.com/console",
      "STUDIO_EMAIL": "you@yourcompany.com",
      "STUDIO_PASSWORD": "…"
    }
  }
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
    hosts: ["cursor", "claude", "agents"],
  };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--cwd") out.cwd = rest[++i];
    else if (a === "--global-mcp") out.globalMcp = true;
    else if (a === "--no-mcp") out.noMcp = true;
    else if (a === "--hosts") {
      out.hosts = String(rest[++i] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return out;
}
