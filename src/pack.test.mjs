import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, access, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:http";
import { applyIdePack, fetchIdePack } from "./pack.mjs";

const FIXTURE_PACK = {
  ok: true,
  package: "@closurenetwork/ide",
  version: "ide_testfixture0001",
  updatedAt: "2026-07-25T00:00:00.000Z",
  studioUrl: "https://closureapps.com/console",
  mcp: {
    name: "closure",
    url: "https://mcp.closureapps.com",
    type: "http",
  },
  files: [
    {
      path: "AGENTS.md",
      mode: "section",
      sectionId: "closure-ide",
      content: "# Closure (IDE)\n\nUse platform_* tools.\n",
    },
    {
      path: ".cursor/rules/closure-product-graph.mdc",
      mode: "write",
      content:
        "---\ndescription: test\nalwaysApply: true\n---\n\n# graph\n",
    },
    {
      path: ".cursor/skills/closure-platform/closure-way-graph.md",
      mode: "write",
      content: "# Closure way — semantic graph\n",
    },
  ],
};

test("applyIdePack writes rails + .closure/pack.json", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "closure-ide-"));
  const { written, meta } = await applyIdePack({
    cwd,
    pack: FIXTURE_PACK,
    hosts: ["cursor", "agents", "claude"],
  });
  assert.ok(written.length >= 3);
  assert.equal(meta.version, FIXTURE_PACK.version);
  await access(join(cwd, ".cursor", "rules", "closure-product-graph.mdc"));
  await access(
    join(cwd, ".cursor", "skills", "closure-platform", "closure-way-graph.md"),
  );
  await access(
    join(cwd, ".claude", "skills", "closure-platform", "closure-way-graph.md"),
  );
  const agents = await readFile(join(cwd, "AGENTS.md"), "utf8");
  assert.match(agents, /BEGIN closure-ide/);
  assert.match(agents, /platform_\*/);
  const packMeta = JSON.parse(
    await readFile(join(cwd, ".closure", "pack.json"), "utf8"),
  );
  assert.equal(packMeta.package, "@closurenetwork/ide");
});

test("fetchIdePack reads JSON from HTTP", async () => {
  const server = createServer((req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(FIXTURE_PACK));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address();
  try {
    const pack = await fetchIdePack(`http://127.0.0.1:${port}/pack`);
    assert.equal(pack.version, FIXTURE_PACK.version);
    assert.equal(pack.files.length, 3);
  } finally {
    server.close();
  }
});

test("section upsert migrates legacy marker", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "closure-ide-"));
  await writeFile(
    join(cwd, "AGENTS.md"),
    "<!-- BEGIN closure-platform-ide -->\nold\n<!-- END closure-platform-ide -->\n",
    "utf8",
  );
  await applyIdePack({
    cwd,
    pack: {
      ...FIXTURE_PACK,
      files: [FIXTURE_PACK.files[0]],
    },
    hosts: ["agents"],
  });
  const agents = await readFile(join(cwd, "AGENTS.md"), "utf8");
  assert.match(agents, /BEGIN closure-ide/);
  assert.doesNotMatch(agents, /closure-platform-ide/);
  assert.match(agents, /platform_\*/);
});
