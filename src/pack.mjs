import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { defaultPackUrl } from "./paths.mjs";

/**
 * @typedef {{ path: string, content: string, mode?: "write"|"section", sectionId?: string }} PackFile
 * @typedef {{
 *   ok?: boolean,
 *   package?: string,
 *   version: string,
 *   updatedAt?: string|null,
 *   studioUrl?: string,
 *   mcp?: { name: string, url: string, type?: string },
 *   files: PackFile[],
 *   tip?: string,
 * }} IdePack
 */

/** @param {string} [url] */
export async function fetchIdePack(url = defaultPackUrl()) {
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(
      `Failed to fetch IDE pack from ${url} (HTTP ${res.status}). Set CLOSURE_IDE_PACK_URL or STUDIO_URL.`,
    );
  }
  const pack = /** @type {IdePack} */ (await res.json());
  if (!pack?.files?.length || !pack.version) {
    throw new Error(`Invalid IDE pack from ${url}: missing files/version`);
  }
  return pack;
}

/**
 * Materialize pack files into a project (IDE matrix).
 * @param {{ cwd: string, pack: IdePack, hosts?: string[], packUrl?: string }} opts
 */
export async function applyIdePack(opts) {
  const cwd = opts.cwd;
  const hosts = new Set(opts.hosts || ["cursor", "claude", "agents", "copilot"]);
  const written = [];
  const pack = opts.pack;
  const packUrl = opts.packUrl || defaultPackUrl();

  for (const file of pack.files) {
    const rel = file.path.replace(/^\.\//, "");
    if (!hosts.has("cursor") && rel.startsWith(".cursor/")) continue;
    if (!hosts.has("claude") && (rel.startsWith(".claude/") || rel === "CLAUDE.md")) {
      continue;
    }
    if (!hosts.has("agents") && rel === "AGENTS.md") continue;
    if (!hosts.has("copilot") && rel.startsWith(".github/")) continue;

    if (file.mode === "section" || rel === "AGENTS.md" || rel === "CLAUDE.md") {
      const sectionId = file.sectionId || "closure-ide";
      const dest = join(cwd, rel);
      await upsertMarkedSection(dest, sectionId, file.content);
      written.push(dest);
      continue;
    }

    const dest = join(cwd, rel);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, ensureTrailingNewline(file.content), "utf8");
    written.push(dest);

    // Mirror Cursor skills into Claude skills dir
    if (
      hosts.has("claude") &&
      rel.startsWith(".cursor/skills/closure-platform/") &&
      rel.endsWith(".md")
    ) {
      const name = rel.split("/").pop();
      const claudeDest = join(
        cwd,
        ".claude",
        "skills",
        "closure-platform",
        name,
      );
      await mkdir(dirname(claudeDest), { recursive: true });
      await copyFile(dest, claudeDest);
      written.push(claudeDest);
    }
  }

  const metaPath = join(cwd, ".closure", "pack.json");
  await mkdir(dirname(metaPath), { recursive: true });
  const meta = {
    package: pack.package || "@closure/ide",
    version: pack.version,
    updatedAt: pack.updatedAt || null,
    fetchedAt: new Date().toISOString(),
    packUrl,
    studioUrl: pack.studioUrl || null,
    files: pack.files.map((f) => ({
      path: f.path,
      sha256: sha256(f.content),
    })),
  };
  await writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`, "utf8");
  written.push(metaPath);

  return { written, meta };
}

/** @param {string} cwd */
export async function readLocalPackMeta(cwd) {
  try {
    return JSON.parse(
      await readFile(join(cwd, ".closure", "pack.json"), "utf8"),
    );
  } catch {
    return null;
  }
}

async function upsertMarkedSection(path, id, body) {
  const start = `<!-- BEGIN ${id} -->`;
  const end = `<!-- END ${id} -->`;
  const block = `${start}\n${body.trim()}\n${end}\n`;
  let existing = "";
  try {
    existing = await readFile(path, "utf8");
  } catch {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, `${block}\n`, "utf8");
    return;
  }
  // Migrate legacy marker from @closure-platform/ide
  const legacyStart = "<!-- BEGIN closure-platform-ide -->";
  const legacyEnd = "<!-- END closure-platform-ide -->";
  let text = existing;
  if (text.includes(legacyStart)) {
    text = text.replace(
      new RegExp(
        `${escapeReg(legacyStart)}[\\s\\S]*?${escapeReg(legacyEnd)}\\n?`,
        "m",
      ),
      block,
    );
    await writeFile(path, text, "utf8");
    return;
  }
  const re = new RegExp(
    `${escapeReg(start)}[\\s\\S]*?${escapeReg(end)}\\n?`,
    "m",
  );
  if (re.test(text)) {
    await writeFile(path, text.replace(re, block), "utf8");
  } else {
    await writeFile(path, `${text.trimEnd()}\n\n${block}\n`, "utf8");
  }
}

function escapeReg(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ensureTrailingNewline(s) {
  return s.endsWith("\n") ? s : `${s}\n`;
}

function sha256(s) {
  return createHash("sha256").update(s, "utf8").digest("hex");
}
