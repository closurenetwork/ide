import {
  applyIdePack,
  fetchIdePack,
  readLocalPackMeta,
} from "../pack.mjs";
import { defaultPackUrl } from "../paths.mjs";

/** Re-fetch Agent Pack from Platform Knowledge and rewrite rails (not MCP creds). */
export async function cmdSync(args) {
  const packUrl = args.packUrl || defaultPackUrl();
  const prev = await readLocalPackMeta(args.cwd);
  console.log(`Fetching Agent Pack…\n  ${packUrl}`);
  const pack = await fetchIdePack(packUrl);
  const { written, meta } = await applyIdePack({
    cwd: args.cwd,
    pack,
    hosts: args.hosts,
    packUrl,
  });

  if (prev?.version && prev.version === meta.version) {
    console.log(`\nAlready up to date (${meta.version})`);
  } else {
    console.log(
      `\nSynced ${prev?.version || "(none)"} → ${meta.version}`,
    );
  }
  for (const p of written) console.log(`  ${p}`);
  return 0;
}
