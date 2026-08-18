// Renomeia .mts antigo do preload pra .trash (safety policy: nunca hard-delete).
import { renameSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const trashDir = join(__dirname, "..", ".trash");
const oldFile = join(__dirname, "..", "src", "preload", "index.mts");

if (!existsSync(oldFile)) {
  console.log("[trash-old-mts] nothing to do (index.mts nao existe)");
  process.exit(0);
}

mkdirSync(trashDir, { recursive: true });
const ts = Date.now();
const target = join(trashDir, `index.mts.${ts}.trash`);

try {
  renameSync(oldFile, target);
  console.log(`[trash-old-mts] moved ${oldFile} -> ${target}`);
} catch (err) {
  console.error(`[trash-old-mts] FAILED: ${err.message}`);
  process.exit(1);
}
