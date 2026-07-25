import { exportDoctrine } from "../export-doctrine.mjs";

export async function cmdExport(args) {
  const written = await exportDoctrine(args);
  console.log("Exported:");
  for (const p of written) console.log(`  ${p}`);
  return 0;
}
