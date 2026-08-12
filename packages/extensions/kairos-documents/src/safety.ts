/**
 * Safety guard para kairos-documents. Mesmo padrão das outras extensions.
 */

import path from "node:path";
import fs from "node:fs";
import os from "node:os";

export class PathGuardError extends Error {
  constructor(public readonly requestedPath: string, public readonly reason: string) {
    super(`Acesso negado a "${requestedPath}": ${reason}`);
    this.name = "PathGuardError";
  }
}

let cachedAllowed: string[] | null = null;

function defaultAllowedPaths(): string[] {
  const home = os.homedir();
  const candidates = [
    home,
    path.join(home, "Desktop"),
    path.join(home, "Documents"),
    path.join(home, "Downloads"),
    path.join(home, "Pictures"),
    path.join(home, "Videos"),
    path.join(home, "Music"),
    process.cwd(),
  ];
  return candidates.filter((p, i) => i === 0 || (fs.existsSync(p) && fs.statSync(p).isDirectory()));
}

function loadAllowed(): string[] {
  if (cachedAllowed) return cachedAllowed;
  const envExtra = process.env.KAIROS_ALLOWED_PATHS;
  const fromEnv = envExtra ? envExtra.split(path.delimiter).filter(Boolean) : [];
  cachedAllowed = [...defaultAllowedPaths(), ...fromEnv];
  return cachedAllowed;
}

export function ensureAllowed(target: string): string {
  if (!path.isAbsolute(target)) {
    throw new PathGuardError(target, "path precisa ser absoluto");
  }
  const abs = path.resolve(target);
  if (!loadAllowed().some((root) => {
    const rel = path.relative(root, abs);
    return !rel.startsWith("..") && !path.isAbsolute(rel);
  })) {
    throw new PathGuardError(abs, "fora dos diretórios permitidos");
  }
  return abs;
}
