import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { AuctionMetadataOverride } from '~/features/Toucan/Config/config'

/**
 * Whether indexed token metadata is trustworthy enough to drive display math.
 *
 * On some chains the backend can return corrupt metadata for launched tokens
 * (decimals=0 together with an empty name and symbol) while ingestion is broken.
 * Feeding decimals=0 into formatUnits/Q96 scaling renders wildly mis-scaled
 * values (e.g. a raw un-scaled total supply), so that signature is treated as
 * "not loaded yet". A legitimate 0-decimals token keeps its real name/symbol
 * and still passes this check — we never assume a decimals value, since the
 * token factory is permissionless and tokens can have unusual decimals.
 */
export function isUsableAuctionTokenMetadata({
  decimals,
  symbol,
  name,
}: {
  decimals: number | undefined
  symbol: string | undefined
  name: string | undefined
}): boolean {
  if (decimals === undefined) {
    return false
  }
  if (decimals === 0 && !symbol && !name) {
    return false
  }
  return true
}

/**
 * Resolves the auction token decimals used by formatting/scale math.
 *
 * Returns undefined while the token metadata is missing or corrupt (see
 * isUsableAuctionTokenMetadata) — callers must render a loading/fallback state
 * instead of assuming a value like 18.
 */
export function getAuctionTokenDecimals(token: CurrencyInfo | null | undefined): number | undefined {
  if (!token) {
    return undefined
  }
  const { decimals, symbol, name } = token.currency
  return isUsableAuctionTokenMetadata({ decimals, symbol, name }) ? decimals : undefined
}

// X handles are 1-15 chars, alphanumeric or underscore. Validating before building the
// URL prevents a malformed value (e.g. `intent/follow?screen_name=...`) from resolving to
// an arbitrary x.com path under the "Twitter" badge, without relying on backend moderation.
const X_HANDLE_REGEX = /^[A-Za-z0-9_]{1,15}$/

/**
 * Builds the X (Twitter) profile URL for a bare handle (no `@` prefix), matching the
 * existing pattern used on the token details page. Returns undefined when the value is not
 * a well-formed X handle, so callers hide the badge rather than link to an arbitrary path.
 */
export function getXProfileUrl(xHandle: string): string | undefined {
  return X_HANDLE_REGEX.test(xHandle) ? `https://x.com/${xHandle}` : undefined
}

/**
 * Merges the manually curated config override with the launched-token metadata
 * returned by the auction API (`tokenDescription` / `xHandle` on `data.v1.Auction`).
 *
 * The config override is authoritative and wins over the API values — it is a deliberate,
 * curated fix. (This is temporary; the override layer is slated for removal, after which the
 * API will be the source of truth.) The API fields only fill the gaps the override leaves,
 * and the override still supplies `website` / `launchedByName`, which the API does not
 * return. Both API fields are unset (not empty string) while a newly launched token's
 * metadata is pending moderation, in which case the override (if any) is used and otherwise
 * the corresponding UI sections stay hidden.
 *
 * Returns undefined when there is no metadata at all so callers can hide the
 * whole section, preserving the previous behavior.
 */
export function mergeAuctionTokenMetadata({
  override,
  tokenDescription,
  xHandle,
}: {
  override: AuctionMetadataOverride | undefined
  tokenDescription: string | undefined
  xHandle: string | undefined
}): AuctionMetadataOverride | undefined {
  // `||` (not `??`) so an empty-string API value is treated as absent, independent of
  // whether the backend leaves the field unset or serializes it as "".
  const description = override?.description || tokenDescription
  const twitter = override?.twitter || (xHandle ? getXProfileUrl(xHandle) : undefined)

  if (!override && !description && !twitter) {
    return undefined
  }

  return { ...override, description, twitter }
}

/**
 * Resolves the auction token logo with the precedence:
 * API image (`tokenImageUrl`: the creator upload, or the Mission Control
 * `auction_token_logo_overrides` override) -> indexed token logo -> `TokenLogo` placeholder.
 *
 * Without an API image the token info is returned unchanged, so the indexed logo on
 * `tokenInfo.logoUrl` (or the placeholder for a logoless token) is preserved.
 */
export function resolveAuctionTokenLogo({
  tokenInfo,
  tokenImageUrl,
}: {
  tokenInfo: CurrencyInfo | undefined
  tokenImageUrl: string | undefined
}): CurrencyInfo | undefined {
  if (!tokenInfo) {
    return tokenInfo
  }

  // `||` (not `??`) so an empty-string API image is treated as absent and falls through
  // to the indexed logo / placeholder, independent of the backend's unset-vs-"" behavior.
  const logoUrl = tokenImageUrl || tokenInfo.logoUrl
  if (logoUrl === tokenInfo.logoUrl) {
    return tokenInfo
  }

  return { ...tokenInfo, logoUrl }
}
