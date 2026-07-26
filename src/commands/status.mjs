import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fetchIdePack, readLocalPackMeta } from "../pack.mjs";
import { defaultPackUrl, defaultStudioUrl, mcpBin, pkgRoot } from "../paths.mjs";

export async function cmdStatus(args) {
  const cwd = args.cwd;
  let ok = true;

  async function check(label, fn) {
    try {
      await fn();
      console.log(`ok   ${label}`);
    } catch (e) {
      ok = false;
      console.log(`FAIL ${label}: ${e instanceof Error ? e.message : e}`);
    }
  }

  console.log(`@closurenetwork/ide status`);
  console.log(`  cwd:    ${cwd}`);
  console.log(`  studio: ${defaultStudioUrl()}`);
  console.log(`  pack:   ${defaultPackUrl()}`);

  await check("package root", async () => access(pkgRoot()));
  await check("mcp binary", async () => access(mcpBin()));

  const local = await readLocalPackMeta(cwd);
  if (local?.version) {
    console.log(`ok   local pack ${local.version} (fetched ${local.fetchedAt || "?"})`);
  } else {
    ok = false;
    console.log("FAIL no .closure/pack.json — run: npx @closurenetwork/ide init");
  }

  await check("AGENTS.md rails", async () => {
    const raw = await readFile(join(cwd, "AGENTS.md"), "utf8");
    if (!raw.includes("BEGIN closure-ide") && !raw.includes("BEGIN closure-platform-ide")) {
      throw new Error("missing Closure IDE section");
    }
  });
  await check("cursor product-graph rule", async () =>
    access(join(cwd, ".cursor", "rules", "closure-product-graph.mdc")),
  );

  try {
    const raw = await readFile(join(cwd, ".cursor", "mcp.json"), "utf8");
    const j = JSON.parse(raw);
    const mcpKey = j.mcpServers?.closure
      ? "closure"
      : j.mcpServers?.["closure-platform"]
        ? "closure-platform"
        : null;
    if (mcpKey) {
      const e = j.mcpServers[mcpKey];
      console.log(
        `ok   MCP ${mcpKey}${mcpKey === "closure-platform" ? " (legacy — run sync)" : ""} (${e.url ? "remote Connect" : "stdio"})`,
      );
    } else {
      console.log("WARN .cursor/mcp.json missing closure");
    }
  } catch {
    console.log("WARN no .cursor/mcp.json (run init)");
  }

  try {
    const remote = await fetchIdePack(defaultPackUrl());
    if (local?.version && local.version === remote.version) {
      console.log(`ok   remote pack matches (${remote.version})`);
    } else if (local?.version) {
      console.log(
        `WARN remote pack ${remote.version} ≠ local ${local.version} — run: npx @closurenetwork/ide sync`,
      );
    } else {
      console.log(`ok   remote pack ${remote.version} (${remote.files.length} files)`);
    }
  } catch (e) {
    console.log(
      `WARN remote pack: ${e instanceof Error ? e.message : e}`,
    );
  }

  console.log(ok ? "\nstatus: ready" : "\nstatus: issues found");
  return ok ? 0 : 1;
}
