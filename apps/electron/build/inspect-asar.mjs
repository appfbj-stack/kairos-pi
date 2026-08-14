import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
// @electron/asar está em .pnpm/ no root
const asar = require("C:/Users/ferna/.minimax-agent/projects/kairos-pi/node_modules/.pnpm/@electron+asar@3.4.1/node_modules/@electron/asar");
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const asarPath = path.resolve(__dirname, "..", "release", "win-unpacked", "resources", "app.asar");

console.log("Inspecting:", asarPath);
console.log();

const files = asar.listPackage(asarPath);
console.log(`Total files in asar: ${files.length}`);
console.log();
console.log("Top-level structure:");
const topLevel = new Set();
for (const f of files) {
  const parts = f.split("/");
  if (parts[0]) topLevel.add(parts[0] + (parts[1] ? "/" : ""));
}
console.log([...topLevel].sort().join("\n"));

console.log();
console.log("Critical files:");
const critical = files.filter((f) =>
  f.endsWith("package.json") ||
  f.endsWith("index.mjs") ||
  f.endsWith("index.js") ||
  f.includes("main/index") ||
  f.includes("preload/index") ||
  f.includes("renderer/index.html")
);
for (const f of critical) console.log("  " + f);
