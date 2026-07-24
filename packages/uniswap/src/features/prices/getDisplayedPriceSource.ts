import type { QueryClient } from '@tanstack/react-query'
import { getTokenPriceSource } from '@universe/prices'

/**
 * Analytics tag for which pricing pipeline produced a displayed USD value.
 * Sent on user-funnel events so we can segment behavior by data source without
 * joining on the Statsig experiment assignment.
 */
export type PriceSourceTag =
  | 'aurora_ws'
  | 'aurora_rest_fallback'
  | 'tapi_quote'
  | 'legacy_subgraph'
  | 'legacy_coingecko'
  // Displayed USD values were derived from the trade quote itself (one side anchored
  // to an external price, the other converted through the quote — see INFRA-2364).
  | 'trade_derived'

/**
 * Which UI surface displayed the price. Different surfaces fall back to
 * different legacy sources when the centralized service is off:
 *   - usdc:         swap-adjacent USD values (TAPI quote in control)
 *   - spot:         token spot price (GQL subgraph in control)
 *   - market_stats: market cap / FDV / 52-week (CoinGecko in control)
 *   - chart:        historical chart data (GQL subgraph in control)
 */
export type PriceSurface = 'usdc' | 'spot' | 'market_stats' | 'chart'

interface Args {
  isCentralizedPricesEnabled: boolean
  surface: PriceSurface
  chainId: number
  address: string
  /**
   * True when the displayed USD values were trade-derived: one side anchored to an
   * external price and the other converted through the trade quote (route mid or
   * execution price), rather than each side reading its own oracle. Takes precedence
   * over per-token cache sources since no single token's source describes the pair.
   */
  isTradeDerivedUsd?: boolean
  /**
   * The React Query client whose cache holds the prices written by
   * `LivePricesProvider`. Pass the platform's shared client (e.g.
   * `SharedQueryClient` from `@universe/api` on web). Required when
   * `isCentralizedPricesEnabled` is true; ignored otherwise.
   */
  queryClient?: QueryClient
}

/**
 * Single source of truth for the `price_source` analytics property.
 *
 * Resolves the displayed-value pipeline by combining (a) the centralized-prices
 * gate state and (b) when the gate is on, the per-token cache entry's `source`.
 *
 * Falls back to `aurora_rest_fallback` when treatment is on but the cache has
 * no entry yet — this matches the user-visible behavior (price will arrive via
 * the next REST poll) better than returning `undefined`.
 */
export function getDisplayedPriceSource({
  isCentralizedPricesEnabled,
  surface,
  chainId,
  address,
  queryClient,
  isTradeDerivedUsd,
}: Args): PriceSourceTag {
  if (isTradeDerivedUsd) {
    return 'trade_derived'
  }

  if (!isCentralizedPricesEnabled) {
    if (surface === 'usdc') {
      return 'tapi_quote'
    }
    if (surface === 'market_stats') {
      return 'legacy_coingecko'
    }
    return 'legacy_subgraph'
  }

  const cached = queryClient ? getTokenPriceSource(queryClient, chainId, address) : undefined
  return cached ?? 'aurora_rest_fallback'
}
