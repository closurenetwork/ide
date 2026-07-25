import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { exportDoctrine } from "./export-doctrine.mjs";

test("exportDoctrine writes cursor + agents", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "closure-ide-"));
  const written = await exportDoctrine({
    cwd,
    hosts: ["cursor", "agents"],
  });
  assert.ok(written.length >= 3);
  await access(join(cwd, ".cursor", "rules", "closure-product-graph.mdc"));
  await access(
    join(cwd, ".cursor", "skills", "closure-platform", "closure-way-graph.md"),
  );
  const agents = await readFile(join(cwd, "AGENTS.md"), "utf8");
  assert.match(agents, /BEGIN closure-platform-ide/);
  assert.match(agents, /platform_\*/);
});
