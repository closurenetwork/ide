import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { mcpBin, pkgRoot } from "../paths.mjs";

export async function cmdDoctor(args) {
  const cwd = args.cwd;
  let ok = true;

  async function check(label, fn) {
    try {
      await fn();
      console.log(`ok  ${label}`);
    } catch (e) {
      ok = false;
      console.log(`FAIL ${label}: ${e instanceof Error ? e.message : e}`);
    }
  }

  await check("package root", async () => access(pkgRoot()));
  await check("mcp binary", async () => access(mcpBin()));
  await check("mcp dist (run npm run build)", async () =>
    access(join(pkgRoot(), "mcp", "dist", "index.js")),
  );

  await check("cursor rules", async () =>
    access(join(cwd, ".cursor", "rules", "closure-product-graph.mdc")),
  );
  await check("cursor skills", async () =>
    access(
      join(cwd, ".cursor", "skills", "closure-platform", "closure-way-graph.md"),
    ),
  );

  const studioUrl = process.env.STUDIO_URL;
  if (studioUrl && process.env.STUDIO_EMAIL && process.env.STUDIO_PASSWORD) {
    await check(`studio login ${studioUrl}`, async () => {
      const res = await fetch(`${studioUrl.replace(/\/$/, "")}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: process.env.STUDIO_EMAIL,
          password: process.env.STUDIO_PASSWORD,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    });
  } else {
    console.log("skip studio login (set STUDIO_URL + STUDIO_EMAIL + STUDIO_PASSWORD)");
  }

  // Soft: mcp.json presence
  try {
    const raw = await readFile(join(cwd, ".cursor", "mcp.json"), "utf8");
    const j = JSON.parse(raw);
    if (j.mcpServers?.["closure-platform"]) {
      console.log("ok  .cursor/mcp.json has closure-platform");
    } else {
      console.log("WARN .cursor/mcp.json missing closure-platform entry");
    }
  } catch {
    console.log("WARN no .cursor/mcp.json in cwd (run init)");
  }

  console.log(ok ? "\ndoctor: pass" : "\ndoctor: issues found");
  return ok ? 0 : 1;
}
