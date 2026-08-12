/**
 * Tipos da API exposta pelo preload no `window.kairos`.
 *
 * Sprint 0: só `ping`. Sprint 1 expande.
 */

import type { KairosAPI } from "../preload/index.js";

declare global {
  interface Window {
    kairos?: KairosAPI;
  }
}

export {};
