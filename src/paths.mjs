import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export function pkgRoot() {
  return join(dirname(fileURLToPath(import.meta.url)), "..");
}

export function doctrineDir() {
  return join(pkgRoot(), "doctrine");
}

export function templatesDir() {
  return join(pkgRoot(), "templates");
}

export function mcpBin() {
  return join(pkgRoot(), "mcp", "bin", "platform-mcp.mjs");
}
