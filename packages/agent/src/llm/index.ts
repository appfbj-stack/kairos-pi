/**
 * LLM facade — entrypoint público do sistema de LLM do agente.
 */

export {
  KNOWN_PROVIDERS,
  type KnownProvider,
  type ProviderConfig,
  type OllamaModelInfo,
  readProviderConfigFromEnv,
  buildModel,
  resolveApiKey,
  listOllamaModels,
} from "./provider.js";
export { runLlmLoop } from "./loop.js";
