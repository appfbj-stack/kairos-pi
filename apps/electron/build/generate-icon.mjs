/**
 * Wrapper de compatibilidade. O gerador real agora é generate-kx-icon.mjs
 * (logo oficial KX + ampulheta). Este arquivo existe pra nao quebrar o script
 * `pnpm icons` no package.json.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const real = join(__dirname, "generate-kx-icon.mjs");

console.log("[generate-icon] Redirecionando para generate-kx-icon.mjs...");
const child = spawn(process.execPath, [real], { stdio: "inherit", cwd: __dirname });
child.on("exit", (code) => process.exit(code ?? 0));
