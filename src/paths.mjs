import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export function pkgRoot() {
  return join(dirname(fileURLToPath(import.meta.url)), "..");
}

export function mcpBin() {
  return join(pkgRoot(), "mcp", "bin", "platform-mcp.mjs");
}

/** Default SaaS console (no trailing slash). */
export function defaultStudioUrl() {
  return (
    process.env.STUDIO_URL ||
    process.env.CLOSURE_STUDIO_URL ||
    "https://closureapps.com/console"
  ).replace(/\/$/, "");
}

/** Public Agent Pack URL. */
export function defaultPackUrl() {
  if (process.env.CLOSURE_IDE_PACK_URL) {
    return process.env.CLOSURE_IDE_PACK_URL.replace(/\/$/, "");
  }
  return `${defaultStudioUrl()}/api/public/ide/pack`;
}
