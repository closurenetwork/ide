import { test } from "node:test";
import assert from "node:assert/strict";
import { remoteMcpUrl } from "./mcp-config.mjs";

test("remoteMcpUrl maps SaaS console to dedicated MCP host", () => {
  assert.equal(
    remoteMcpUrl("https://closureapps.com/console"),
    "https://mcp.closureapps.com",
  );
  assert.equal(
    remoteMcpUrl("https://closureapps.com/console/"),
    "https://mcp.closureapps.com",
  );
});

test("remoteMcpUrl keeps path-scoped URL for local / custom studios", () => {
  assert.equal(
    remoteMcpUrl("http://localhost:3021"),
    "http://localhost:3021/api/mcp",
  );
  assert.equal(
    remoteMcpUrl("https://studio.example.com"),
    "https://studio.example.com/api/mcp",
  );
});
