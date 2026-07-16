/**
 * Token logo resolution for the HookSwap data-api.
 *
 * Two sources, in priority order (see `resolveTokenLogo`):
 *   1. TOKEN_LOGOS — a small hardcoded map of curated logos (WETH/tHOOK/USDG on Robinhood). Highest
 *      priority so those never change out from under us.
 *   2. Launchpad metadataURI — for tokens minted by the HookOSV3Launcher (fair-launch tokens), the
 *      launcher stores a per-token `metadataURI` on-chain. We read it live, resolve that URI to an image
 *      URL, and use it. This is what makes a freshly-launched token show an icon in the selector / markets
 *      / swap without any manual registry entry.
 *
 * NEVER FABRICATE: a token with no curated entry, no launchpad metadataURI, or an unresolvable URI gets
 * NO logo (undefined) — an honest "no icon", never a placeholder.
 *
 * NON-BLOCKING: `resolveTokenLogo` / `getLaunchpadLogo` are SYNCHRONOUS. On a cache miss they return
 * `undefined` immediately and kick off the on-chain read + URI fetch in the BACKGROUND, so a handler
 * response never waits on the network. The next request for that token (after resolution completes)
 * returns the resolved logo from cache. Terminal outcomes (including "no logo") are cached; only a
 * transient RPC error reading the metadataURI is left uncached so it can retry on a later request.
 */

import { ethers } from 'ethers'
import { getProvider } from './onchain'

/**
 * Curated logos for HookSwap chains (keyed by lowercased address; chain-agnostic, matching the prior
 * inline map). Higher priority than launchpad resolution — see `resolveTokenLogo`.
 */
const TOKEN_LOGOS: Record<string, string> = {
  // Robinhood (4663)
  '0x0bd7d308f8e1639fab988df18a8011f41eacad73': 'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/info/logo.png', // WETH → ETH logo
  '0x3b5a01efc59f3465b8eb04697f97cfe0ba700d9d': 'https://hookswap.org/brand/glyph-mark.png', // tHOOK
  '0x5fc5360d0400a0fd4f2af552add042d716f1d168': 'https://coin-images.coingecko.com/coins/images/41172/large/USDG_Logo.png', // USDG
}

/**
 * Deployed `HookOSV3Launcher` proxy address per chain (mirrors
 * apps/web/src/terminal/launchpad/addresses.ts). Only chains listed here get launchpad logo resolution;
 * every other chain resolves to no launchpad logo with zero RPC. Robinhood (4663) is the only deployment.
 */
const LAUNCHER_ADDRESSES: Record<number, string> = {
  4663: '0x9B8d992704ddf38729535A641502bcc55734e0B8',
}

/**
 * Minimal `HookOSV3Launcher` ABI — only the two views used to read a token's launch metadataURI.
 * `isHookOSV3Token` is a cheap bool guard (won't revert for a non-launch token), so we can distinguish a
 * deterministic "not a launch → no logo" from a transient RPC error; `getLaunchByToken` returns the launch
 * struct whose `metadataURI` field we read. (Full ABI: apps/web/src/terminal/launchpad/abis.ts.)
 */
const LAUNCHER_ABI = [
  'function isHookOSV3Token(address) view returns (bool)',
  'function getLaunchByToken(address token) view returns (address token, address pool, address creator, uint256 tokenId, uint24 feeTier, uint8 dex, address locker, uint8 pair, address pairToken, string metadataURI, uint256 createdAt)',
]

/** HTTP fetch budget for a metadataURI (and any nested image URL). Mirrors onchain.ts' 8s RPC cap intent
 *  — short enough that a slow/dead URI can't stall a handler; resolution runs in the background regardless. */
const FETCH_TIMEOUT_MS = 5_000

/** Public IPFS gateway for `ipfs://` normalization. */
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/'

/** Path looks like a direct image (extension, ignoring any query/fragment). */
const IMAGE_EXT_RE = /\.(png|jpe?g|svg|gif|webp)(?:[?#].*)?$/i
/** Path looks like a JSON metadata document. */
const JSON_EXT_RE = /\.json(?:[?#].*)?$/i

interface CacheEntry {
  /** the launch metadataURI this entry resolved from ('' when the token has none / isn't a launch). */
  metadataURI: string
  /** resolved image URL, or undefined for an honest "no logo". */
  logoUrl?: string
}

/** Resolved (terminal) results keyed by `${chainId}:${addressLower}`. Also the "already resolved" marker. */
const cache = new Map<string, CacheEntry>()
/** Keys with a background resolve in flight — dedupes concurrent resolves for the same token. */
const inFlight = new Set<string>()

/** ipfs:// (and ipfs://ipfs/) → a public gateway URL; otherwise returned trimmed unchanged. */
function normalizeUri(uri: string): string {
  const t = uri.trim()
  if (/^ipfs:\/\//i.test(t)) {
    let cid = t.replace(/^ipfs:\/\//i, '')
    cid = cid.replace(/^ipfs\//i, '')
    return `${IPFS_GATEWAY}${cid}`
  }
  return t
}

/** Extract an image URL from a parsed metadata JSON's `image` / `logo` / `image_url` field (normalized). */
function imageFromJson(json: unknown): string | undefined {
  if (!json || typeof json !== 'object') {
    return undefined
  }
  const obj = json as Record<string, unknown>
  const candidate = obj.image ?? obj.logo ?? obj.image_url
  if (typeof candidate !== 'string' || candidate.trim() === '') {
    return undefined
  }
  const normalized = normalizeUri(candidate)
  return /^https?:\/\//i.test(normalized) ? normalized : undefined
}

/** fetch() with a hard timeout so a slow URI can't hang the background resolve. */
async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { signal: controller.signal, redirect: 'follow' })
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Resolve a launch metadataURI to an image URL, per the rules:
 *   - normalize ipfs:// → gateway; only http(s) URIs are usable.
 *   - direct image (image extension) → use the URI itself (no fetch).
 *   - otherwise fetch once: content-type image/* → use the URI; JSON (by extension or content-type) →
 *     parse and take image/logo/image_url.
 *   - anything else / any failure → undefined (no logo). Never throws for a "not an image" outcome; a
 *     network/parse error propagates to the caller, which logs + caches no-logo.
 */
async function resolveUriToLogo(rawUri: string): Promise<string | undefined> {
  const uri = normalizeUri(rawUri)
  if (!/^https?:\/\//i.test(uri)) {
    return undefined
  }
  if (IMAGE_EXT_RE.test(uri)) {
    return uri
  }
  const res = await fetchWithTimeout(uri)
  if (!res.ok) {
    return undefined
  }
  const contentType = (res.headers.get('content-type') || '').toLowerCase()
  if (contentType.startsWith('image/')) {
    return uri
  }
  const looksJson =
    JSON_EXT_RE.test(uri) ||
    contentType.includes('application/json') ||
    contentType.includes('+json') ||
    contentType.includes('text/json')
  if (looksJson) {
    const json = (await res.json()) as unknown
    return imageFromJson(json)
  }
  return undefined
}

/** Live read of a token's launch metadataURI. Returns '' for a non-launch token; throws on RPC error. */
async function readMetadataURI(chainId: number, launcher: string, token: string): Promise<string> {
  const contract = new ethers.Contract(launcher, LAUNCHER_ABI, getProvider(chainId))
  const isLaunch: boolean = await contract.isHookOSV3Token(token)
  if (!isLaunch) {
    return ''
  }
  const launch = await contract.getLaunchByToken(token)
  const uri = launch?.metadataURI
  return typeof uri === 'string' ? uri.trim() : ''
}

/** Background: read metadataURI + resolve to a logo, then cache the terminal result. Never throws. */
async function resolveInBackground(chainId: number, launcher: string, token: string, key: string): Promise<void> {
  if (inFlight.has(key)) {
    return
  }
  inFlight.add(key)
  try {
    const metadataURI = await readMetadataURI(chainId, launcher, token)
    if (!metadataURI) {
      // Deterministic: not a launch, or a launch with no metadataURI → honest no-logo, cache it.
      cache.set(key, { metadataURI: '' })
      return
    }
    let logoUrl: string | undefined
    try {
      logoUrl = await resolveUriToLogo(metadataURI)
    } catch (e) {
      // URI fetch/parse failure — honest no-logo (still a terminal outcome for this immutable URI).
      // eslint-disable-next-line no-console
      console.warn(`[data-api] logo: failed to resolve metadataURI for ${token} on ${chainId}: ${(e as Error).message}`)
      logoUrl = undefined
    }
    cache.set(key, { metadataURI, logoUrl })
  } catch (e) {
    // RPC error reading the metadataURI — transient; do NOT cache so a later request can retry.
    // eslint-disable-next-line no-console
    console.warn(`[data-api] logo: failed to read launch metadataURI for ${token} on ${chainId}: ${(e as Error).message}`)
  } finally {
    inFlight.delete(key)
  }
}

/**
 * Launchpad logo for a token, from cache. On a miss, kicks off a background resolve and returns
 * `undefined` this call (the handler never waits on the network); a later request returns the resolved
 * value. Chains with no launchpad resolve to no-logo synchronously with zero RPC.
 */
export function getLaunchpadLogo(chainId: number, address: string): string | undefined {
  if (!address) {
    return undefined
  }
  const key = `${chainId}:${address.toLowerCase()}`
  const hit = cache.get(key)
  if (hit) {
    return hit.logoUrl
  }
  const launcher = LAUNCHER_ADDRESSES[chainId]
  if (!launcher) {
    // No launchpad on this chain → terminal no-logo, no RPC.
    cache.set(key, { metadataURI: '' })
    return undefined
  }
  void resolveInBackground(chainId, launcher, address, key)
  return undefined
}

/**
 * The logo URL for a token, or undefined for an honest no-logo. Curated TOKEN_LOGOS win; otherwise a
 * launchpad-launched token's on-chain metadataURI is resolved (lazily + cached — see getLaunchpadLogo).
 * Synchronous + non-blocking: safe to call while building any Token proto.
 */
export function resolveTokenLogo(chainId: number, address: string): string | undefined {
  const curated = address ? TOKEN_LOGOS[address.toLowerCase()] : undefined
  if (curated) {
    return curated
  }
  return getLaunchpadLogo(chainId, address)
}
