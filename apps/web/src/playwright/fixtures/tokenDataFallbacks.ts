// oxlint-disable-next-line no-restricted-imports -- fallback helpers need direct Playwright types
import type { APIResponse, Route } from '@playwright/test'
import { WETH_ADDRESS } from '@uniswap/universal-router-sdk'
import { normalizeTokenAddressForCache, UniverseChainId } from '@universe/chains'
import { DEFAULT_NATIVE_ADDRESS as NATIVE_TOKEN_ADDRESS } from '@universe/prices'
import { DAI, USDC, USDT } from 'uniswap/src/constants/tokens'
import { WEETH_ADDRESS } from '~/playwright/anvil/utils'

/**
 * Deterministic responses served ONLY when the live gateway fails (non-2xx / network error /
 * timeout) on token data reads that specs cannot run without. A healthy live response always
 * passes through untouched.
 */

// Validation hook: the gateway-throttling condition can't be reproduced on demand, so this
// forces the fallback path to make it testable end-to-end. Read once at fixture setup (module
// load) — the deadline helper itself takes it as a parameter.
// oxlint-disable-next-line eslint-js/no-restricted-syntax -- Node-side Playwright code: process.env is the config surface here (no app getConfig())
export const FORCE_TOKEN_DATA_FALLBACK = process.env.E2E_FORCE_TOKEN_DATA_FALLBACK === 'true'

// A healthy live response answers in well under this; anything slower gets the fallback
export const LIVE_RESPONSE_TIMEOUT_MS = 5_000

/**
 * Forwards the routed request to the live backend, resolving undefined on failure OR after
 * timeoutMs. route.fetch has no timeout option of its own, so a hanging (not just failing)
 * gateway would otherwise stall past the 15s expect timeout before the fallback could serve.
 */
export async function fetchLiveResponseWithDeadline({
  route,
  timeoutMs,
  forceFallback,
}: {
  route: Route
  timeoutMs: number
  forceFallback: boolean
}): Promise<APIResponse | undefined> {
  if (forceFallback) {
    return undefined
  }
  const livePromise = route.fetch().catch(() => undefined)
  return Promise.race([
    livePromise,
    new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), timeoutMs)),
  ])
}

/**
 * GetTokenPrices: live prices pass through, synthetic values only fill the gaps.
 *
 * These prices back `usePrice()`/`useUSDCPrice()` (packages/prices/src/hooks/usePrice.ts), which
 * every fiat<->token conversion (e.g. Send's amount input) waits on, so a token must never come
 * back unpriced — that is what the fallback values are for.
 *
 * They also have to agree with the market, which a fixed map cannot: the anvil suite serves
 * /quote from the LIVE trading API (`stubTradingApiEndpoint` re-fetches upstream), and the limit
 * form cross-checks its market-price reference against the ratio of the two tokens' USD prices,
 * rejecting the reference on a >10% divergence (`MAX_MARKET_PRICE_USD_SPOT_DEVIATION` in
 * pages/Swap/Limit/state/limitMarketPrice.ts). A constant that the real market has since moved
 * away from therefore reads as a poisoned reference and disables the limit form outright. Live
 * prices track the same market the quote does; a constant is only a last resort.
 */

// Rough USD anchors for the small set of tokens the anvil e2e suite actually uses (see
// allowedErc20BalanceAddresses in fixtures/anvil.ts), served only for a token the live price
// service did not price. Keyed by lowercased address so it's chain-agnostic — good enough for
// these mainnet-only tests. Being finite and > 0 is all a fallback value guarantees; anything
// compared against a live quote needs the live price instead.
const FALLBACK_TOKEN_USD_PRICES: Record<string, number> = {
  [normalizeTokenAddressForCache(NATIVE_TOKEN_ADDRESS)]: 3000,
  [normalizeTokenAddressForCache(WETH_ADDRESS(UniverseChainId.Mainnet))]: 3000,
  [normalizeTokenAddressForCache(WEETH_ADDRESS)]: 3120,
  [normalizeTokenAddressForCache(USDC.address)]: 1,
  [normalizeTokenAddressForCache(USDT.address)]: 1,
  [normalizeTokenAddressForCache(DAI.address)]: 1,
}
const DEFAULT_FALLBACK_TOKEN_USD_PRICE = 3000

export function fallbackPriceForToken(address: string): number {
  return FALLBACK_TOKEN_USD_PRICES[normalizeTokenAddressForCache(address)] ?? DEFAULT_FALLBACK_TOKEN_USD_PRICE
}

export type TokenPriceRequest = { chainId: number; address: string }

type TokenPrice = {
  chainId: number
  address: string
  priceUsd: number
  updatedAt: string
}

export type TokenPricesResponse = { tokenPrices: TokenPrice[] }

function priceKey({ chainId, address }: { chainId: number; address: string }): string {
  return `${chainId}:${normalizeTokenAddressForCache(address)}`
}

/**
 * A live entry is only usable when its `priceUsd` is a finite number above zero: a missing, null,
 * zero or NaN price leaves the app waiting on a conversion that never resolves, and the limit
 * form's cross-check skips a zero price rather than validating against it.
 */
function isUsableLivePrice(price: { priceUsd?: unknown }): boolean {
  return typeof price.priceUsd === 'number' && Number.isFinite(price.priceUsd) && price.priceUsd > 0
}

/**
 * Reads the usable entries out of a live GetTokenPrices body. An unparseable or wrongly shaped
 * body yields none, which sends every requested token to its fallback value.
 */
export function parseLiveTokenPrices(body: unknown): TokenPrice[] {
  const tokenPrices = (body as { tokenPrices?: unknown } | null)?.tokenPrices
  if (!Array.isArray(tokenPrices)) {
    return []
  }
  return tokenPrices.filter(
    (price): price is TokenPrice =>
      typeof price === 'object' &&
      price !== null &&
      typeof (price as TokenPrice).chainId === 'number' &&
      typeof (price as TokenPrice).address === 'string' &&
      isUsableLivePrice(price as TokenPrice),
  )
}

/**
 * Answers every token the request asked about: the live price where the service returned a usable
 * one, the fallback anchor otherwise. Per-token rather than all-or-nothing on purpose — one
 * unpriced long-tail token must not drag the majors it was requested alongside back onto stale
 * constants, since that is exactly what breaks the limit form's USD cross-check.
 */
export function buildTokenPricesResponse({
  requestedTokens,
  livePrices,
  updatedAt,
}: {
  requestedTokens: TokenPriceRequest[]
  livePrices: TokenPrice[]
  updatedAt: string
}): TokenPricesResponse {
  const liveByKey = new Map(livePrices.map((price) => [priceKey(price), price]))

  return {
    tokenPrices: requestedTokens.map((token) => {
      const live = liveByKey.get(priceKey(token))
      return {
        chainId: token.chainId,
        address: token.address,
        priceUsd: live?.priceUsd ?? fallbackPriceForToken(token.address),
        updatedAt: live?.updatedAt ?? updatedAt,
      }
    }),
  }
}
