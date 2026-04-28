import {
  getAllProviders,
  getModelsByProvider,
  getProvider,
  getProviderModelId
} from 'model-metadata-central'
import type { ModelMetadata, ProviderMetadata } from 'model-metadata-central'

// ─── Provider id aliasing ───────────────────────────────────────────────────
// The plugin's stored settings use `mistral` (and `local` for "any localhost
// OpenAI-compatible server"). MMC uses `mistralai` and dedicated ids
// (lmstudio/ollama/localai). Aliases preserve user data while letting us pull
// metadata from the canonical MMC entry.

const PROVIDER_ALIASES: Record<string, string> = {
  mistral: 'mistralai'
}

const toMmcId = (pluginId: string): string =>
  PROVIDER_ALIASES[pluginId] ?? pluginId

// ─── Plain shape consumed by the plugin UI ──────────────────────────────────

export interface KnownModel {
  id: string
  name: string
  contextWindow?: number
}

export interface ProviderDefaults {
  name: string
  baseUrl?: string
  /** Adapter routing — anthropic protocol vs OpenAI-compatible. */
  apiType: 'anthropic' | 'openai_compatible'
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Strip a trailing `/v1` (or `/v1/`) — adapters append it themselves. */
const stripVersion = (url: string | undefined): string | undefined =>
  url?.replace(/\/v1\/?$/, '')

const formatModel = (m: ModelMetadata, idOnProvider: string): KnownModel => ({
  id: idOnProvider,
  name: m.model_name ?? m.model_id,
  contextWindow: m.context_window
})

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Active (non-deprecated) models for a provider, formatted for the settings UI.
 * For aggregators (e.g. openrouter) the id is the provider-specific routed id
 * like `anthropic/claude-opus-4-7`, not the canonical MMC model_id.
 */
export function getKnownModels(pluginProviderId: string): KnownModel[] {
  const mmcId = toMmcId(pluginProviderId)
  const models = getModelsByProvider(mmcId)
  const result: KnownModel[] = []
  for (const m of models) {
    if (m.deprecated === true) continue
    const idOnProvider = getProviderModelId(m.model_id, mmcId) ?? m.model_id
    result.push(formatModel(m, idOnProvider))
  }
  return result
}

export function getProviderDefaults(
  pluginProviderId: string
): ProviderDefaults | undefined {
  const mmcId = toMmcId(pluginProviderId)
  const p = getProvider(mmcId)
  if (p === undefined) return undefined
  return {
    name: p.name,
    baseUrl: stripVersion(p.base_url),
    apiType: p.api_type === 'anthropic' ? 'anthropic' : 'openai_compatible'
  }
}

/** Adapter routing for an arbitrary provider id (built-in, custom, or unknown). */
export function getApiType(
  pluginProviderId: string
): 'anthropic' | 'openai_compatible' {
  return getProviderDefaults(pluginProviderId)?.apiType ?? 'openai_compatible'
}

/** All MMC providers — useful for diagnostics or future UI. */
export function getAllMmcProviders(): readonly ProviderMetadata[] {
  return getAllProviders()
}
