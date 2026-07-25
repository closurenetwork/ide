import { mkdir, readFile, writeFile, readdir, copyFile } from "node:fs/promises";
import { join } from "node:path";
import { doctrineDir, templatesDir } from "./paths.mjs";

/**
 * Project doctrine SoT → host adapters.
 * @param {{ cwd: string, hosts: string[] }} opts
 */
export async function exportDoctrine(opts) {
  const cwd = opts.cwd;
  const hosts = new Set(opts.hosts || ["cursor", "claude", "agents"]);
  const written = [];

  if (hosts.has("cursor")) {
    const rulesDir = join(cwd, ".cursor", "rules");
    const skillsDir = join(cwd, ".cursor", "skills", "closure-platform");
    await mkdir(rulesDir, { recursive: true });
    await mkdir(skillsDir, { recursive: true });

    for (const name of [
      "product-graph.mdc",
      "no-experience-ts-sot.mdc",
    ]) {
      const src = join(doctrineDir(), name);
      const dest = join(rulesDir, `closure-${name}`);
      await copyFile(src, dest);
      written.push(dest);
    }

    for (const name of await listSkillDocs(doctrineDir())) {
      const dest = join(skillsDir, name);
      await copyFile(join(doctrineDir(), name), dest);
      written.push(dest);
    }
  }

  if (hosts.has("claude")) {
    const skillsDir = join(cwd, ".claude", "skills", "closure-platform");
    await mkdir(skillsDir, { recursive: true });
    for (const name of await listSkillDocs(doctrineDir())) {
      const dest = join(skillsDir, name);
      await copyFile(join(doctrineDir(), name), dest);
      written.push(dest);
    }
    const snippet = await readFile(
      join(templatesDir(), "claude.snippet.md"),
      "utf8",
    );
    const claudePath = join(cwd, "CLAUDE.md");
    await upsertMarkedSection(claudePath, "closure-platform-ide", snippet);
    written.push(claudePath);
  }

  if (hosts.has("agents")) {
    const snippet = await readFile(
      join(templatesDir(), "agents.snippet.md"),
      "utf8",
    );
    const agentsPath = join(cwd, "AGENTS.md");
    await upsertMarkedSection(agentsPath, "closure-platform-ide", snippet);
    written.push(agentsPath);
  }

  return written;
}

async function listSkillDocs(dir) {
  const names = await readdir(dir);
  return names.filter(
    (n) => n.startsWith("closure-way-") && n.endsWith(".md"),
  );
}

/** Insert or replace a fenced managed section. */
async function upsertMarkedSection(path, id, body) {
  const start = `<!-- BEGIN ${id} -->`;
  const end = `<!-- END ${id} -->`;
  const block = `${start}\n${body.trim()}\n${end}\n`;
  let existing = "";
  try {
    existing = await readFile(path, "utf8");
  } catch {
    await writeFile(path, `${block}\n`, "utf8");
    return;
  }
  const re = new RegExp(
    `${escapeReg(start)}[\\s\\S]*?${escapeReg(end)}\\n?`,
    "m",
  );
  if (re.test(existing)) {
    await writeFile(path, existing.replace(re, block), "utf8");
  } else {
    await writeFile(path, `${existing.trimEnd()}\n\n${block}\n`, "utf8");
  }
}

function escapeReg(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
