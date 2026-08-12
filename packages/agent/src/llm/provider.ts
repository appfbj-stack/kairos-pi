/**
 * Provider configuration & Model factory.
 *
 * Lê a config do env (ou de um objeto ProviderConfig) e retorna um Model do
 * pi-ai pronto pra usar com `stream()` / `complete()`.
 *
 * Suporta:
 *   - anthropic       (ANTHROPIC_API_KEY)
 *   - openai          (OPENAI_API_KEY)
 *   - openrouter      (OPENROUTER_API_KEY)
 *   - minimax         (MINIMAX_API_KEY) — placeholder, Fase 2 com gateway Kairos
 *
 * Config via env:
 *   KAIROS_PROVIDER=openrouter
 *   KAIROS_MODEL=anthropic/claude-3.5-sonnet
 *   KAIROS_API_KEY=sk-...  (opcional, default = env do provider)
 */

import { type Api, type Model } from "@earendil-works/pi-ai";
import { getEnvApiKey } from "@earendil-works/pi-ai/compat";
import { getBuiltinModel } from "@earendil-works/pi-ai/providers/all";
import { z } from "zod";

export const KNOWN_PROVIDERS = [
  "anthropic",
  "openai",
  "openrouter",
  "minimax",
] as const;

export type KnownProvider = (typeof KNOWN_PROVIDERS)[number];

export interface ProviderConfig {
  provider: KnownProvider | string;
  modelId: string;
  /** API key explícita. Se omitida, lê do env. */
  apiKey?: string;
}

const envConfigSchema = z.object({
  provider: z.enum(KNOWN_PROVIDERS).default("openrouter"),
  modelId: z.string().default("anthropic/claude-3.5-sonnet"),
  apiKey: z.string().optional(),
});

/** Lê config de env vars. */
export function readProviderConfigFromEnv(): ProviderConfig {
  const raw = {
    provider: process.env.KAIROS_PROVIDER,
    modelId: process.env.KAIROS_MODEL,
    apiKey: process.env.KAIROS_API_KEY,
  };
  const parsed = envConfigSchema.parse({
    provider: raw.provider ?? "openrouter",
    modelId: raw.modelId ?? "anthropic/claude-3.5-sonnet",
    apiKey: raw.apiKey,
  });
  return parsed;
}

/** Retorna o Model do pi-ai para a config. */
export function buildModel(config: ProviderConfig): Model<Api> {
  // getBuiltinModel é tipado por provider conhecido. Para string genérico
  // (custom), fazemos fallback via MODELS. Para MVP, focamos nos conhecidos.
  const provider = config.provider as KnownProvider;
  if (!KNOWN_PROVIDERS.includes(provider)) {
    throw new Error(
      `Provider desconhecido: ${config.provider}. Suportados: ${KNOWN_PROVIDERS.join(", ")}`
    );
  }
  return getBuiltinModel(provider, config.modelId as never) as unknown as Model<Api>;
}

/** Retorna a API key: explícita > env específica do provider > env KAIROS_API_KEY. */
export function resolveApiKey(config: ProviderConfig): string | undefined {
  if (config.apiKey) return config.apiKey;
  if (process.env.KAIROS_API_KEY) return process.env.KAIROS_API_KEY;
  return getEnvApiKey(config.provider);
}
