import { exportDoctrine } from "../export-doctrine.mjs";

/** Refresh doctrine only — does not rewrite MCP credentials. */
export async function cmdUpdate(args) {
  const written = await exportDoctrine(args);
  console.log("Doctrine updated:");
  for (const p of written) console.log(`  ${p}`);
  return 0;
}
