// Sprint 1.7 — escreve dist/preload/package.json com type:commonjs.
// Necessário pq o package.json da raiz tem type:module (forçando ESM no .js),
// mas o preload é CJS. Sub-package.json sobrescreve soh pra dist/preload/.
//
// Uso: node build/write-preload-pkg.mjs
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const targetDir = resolve(__dirname, "..", "dist", "preload");
const targetFile = join(targetDir, "package.json");

if (!existsSync(targetDir)) {
  mkdirSync(targetDir, { recursive: true });
}

writeFileSync(
  targetFile,
  JSON.stringify({ type: "commonjs" }, null, 2) + "\n",
  "utf8",
);

console.log(`[write-preload-pkg] wrote ${targetFile} (type:commonjs)`);
