/**
 * Debug: lista paths do app.asar, detecta paths com `\` (Windows-only) que
 * quebram em runtime. Mostra também o package.json e arquivos críticos.
 */

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const asar = require("C:/Users/ferna/.minimax-agent/projects/kairos-pi/node_modules/.pnpm/@electron+asar@3.4.1/node_modules/@electron/asar");
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const asarPath = path.resolve(__dirname, "..", "release", "win-unpacked", "resources", "app.asar");

console.log("Inspecting:", asarPath, "\n");

const files = asar.listPackage(asarPath);
console.log(`Total files: ${files.length}\n`);

// Detecta paths com \
const winPaths = files.filter((f) => f.includes("\\"));
console.log(`Paths com '\\' (Windows): ${winPaths.length}`);
if (winPaths.length > 0) {
  console.log("Sample (primeiros 10):");
  for (const p of winPaths.slice(0, 10)) console.log("  " + p);
}
console.log();

// Detecta paths com /
const posixPaths = files.filter((f) => !f.includes("\\"));
console.log(`Paths com '/' (POSIX): ${posixPaths.length}`);
console.log();

// Package.json
const pkg = JSON.parse(asar.extractFile(asarPath, "package.json").toString());
console.log("package.json main field:", pkg.main);
console.log("package.json type field:", pkg.type);
console.log();

// Arquivos críticos
const critical = files.filter((f) =>
  f.endsWith("index.js") ||
  f.endsWith("index.mjs") ||
  f.endsWith("package.json")
).filter((f) => f.includes("main") || f.includes("preload") || !f.includes("node_modules"));
console.log("Critical files (main/preload):");
for (const f of critical.slice(0, 20)) console.log("  " + f);
console.log();

// Verifica se main field existe no asar
const mainPath = pkg.main.replace(/\\/g, "/");
const mainExists = files.includes(mainPath);
console.log(`Main file '${mainPath}' exists in asar: ${mainExists}`);

// Verifica preload
const preloadPkg = files.find((f) => f.endsWith("preload/package.json"));
if (preloadPkg) {
  const p = JSON.parse(asar.extractFile(asarPath, preloadPkg).toString());
  console.log(`Preload main field: ${p.main}`);
}
