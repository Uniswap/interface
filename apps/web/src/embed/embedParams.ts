/**
 * HookSwap embeddable swap widget — URL parameter parsing.
 *
 * The widget is a chromeless swap ticket mounted at `/embed/swap`, embedded by
 * third parties via an <iframe>. Its initial state is fully driven by URL query
 * params so a host site can configure it without any JS:
 *
 *   /embed/swap?chain=4663&inputCurrency=NATIVE&outputCurrency=0xabc…&theme=dark
 *
 * Params (all optional):
 *   • chain          — numeric UniverseChainId (e.g. 4663). Must be a known chain;
 *                      falls back to Mainnet otherwise.
 *   • inputCurrency  — `NATIVE` (the chain's native token) or a 0x… token address.
 *   • outputCurrency — same grammar as inputCurrency.
 *   • theme          — `light` | `dark` (default `light`).
 *
 * Token assets are built as bare `CurrencyAsset`s (address + chainId + type); the
 * swap form store resolves decimals/symbol/logo from the token list at runtime, so
 * the host only needs an address — no metadata. An output equal to the input is
 * dropped (the user picks the counter-token in-widget).
 */
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import type { CurrencyAsset } from 'uniswap/src/entities/assets'
import { AssetType } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export type WidgetTheme = 'light' | 'dark'

export interface EmbedConfig {
  chainId: UniverseChainId
  /** Initial sell asset (defaults to the chain's native token). */
  inputAsset: CurrencyAsset
  /** Initial buy asset, or null when unset / equal to the input. */
  outputAsset: CurrencyAsset | null
  theme: WidgetTheme
}

const NATIVE_ALIASES = new Set(['native', 'eth', ''])

/** All known chain ids, for validating the `chain` param. */
const KNOWN_CHAIN_IDS = new Set<number>(
  Object.values(UniverseChainId).filter((v): v is number => typeof v === 'number'),
)

function parseChainId(raw: string | null): UniverseChainId {
  if (raw) {
    const asNumber = Number(raw)
    if (Number.isInteger(asNumber) && KNOWN_CHAIN_IDS.has(asNumber)) {
      return asNumber as UniverseChainId
    }
  }
  return UniverseChainId.Mainnet
}

/** A minimal 0x-address check (20-byte hex). Not a checksum validation. */
function isAddressLike(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value)
}

/**
 * Resolve a currency param to a bare asset. `NATIVE`/`ETH`/empty → the chain's
 * native token; a 0x… address → that token; anything else → undefined.
 */
function parseCurrency(raw: string | null, chainId: UniverseChainId): CurrencyAsset | undefined {
  const value = (raw ?? '').trim()
  if (NATIVE_ALIASES.has(value.toLowerCase())) {
    return { address: getNativeAddress(chainId), chainId, type: AssetType.Currency }
  }
  if (isAddressLike(value)) {
    return { address: value, chainId, type: AssetType.Currency }
  }
  return undefined
}

function parseTheme(raw: string | null): WidgetTheme {
  return raw?.toLowerCase() === 'dark' ? 'dark' : 'light'
}

/** Two assets are the same token when address (case-insensitive) + chain match. */
function sameAsset(a: CurrencyAsset, b: CurrencyAsset): boolean {
  return a.chainId === b.chainId && a.address.toLowerCase() === b.address.toLowerCase()
}

/** Parse an embed config from a URL query string (or `URLSearchParams`). */
export function parseEmbedConfig(search: string | URLSearchParams): EmbedConfig {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search

  const chainId = parseChainId(params.get('chain'))
  const theme = parseTheme(params.get('theme'))

  // Input defaults to the native token when unset/invalid.
  const inputAsset =
    parseCurrency(params.get('inputCurrency'), chainId) ??
    ({ address: getNativeAddress(chainId), chainId, type: AssetType.Currency } as CurrencyAsset)

  // Output is optional; drop it if it collides with the input.
  const outputCandidate = parseCurrency(params.get('outputCurrency'), chainId) ?? null
  const outputAsset = outputCandidate && !sameAsset(outputCandidate, inputAsset) ? outputCandidate : null

  return { chainId, inputAsset, outputAsset, theme }
}

/**
 * Build an embed URL query string from a config (the inverse of
 * {@link parseEmbedConfig}) — used by the Widget Builder to generate the snippet.
 */
export function buildEmbedQuery(config: {
  chainId: UniverseChainId
  inputCurrency: string
  outputCurrency: string
  theme: WidgetTheme
}): string {
  const params = new URLSearchParams()
  params.set('chain', String(config.chainId))
  params.set('inputCurrency', config.inputCurrency || 'NATIVE')
  if (config.outputCurrency) {
    params.set('outputCurrency', config.outputCurrency)
  }
  params.set('theme', config.theme)
  return params.toString()
}
