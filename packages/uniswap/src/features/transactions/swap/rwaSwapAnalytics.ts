import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { Currency } from '@uniswap/sdk-core'
import { PRICE_IMPACT_WARNING_THRESHOLD } from 'uniswap/src/constants/transactions'
import { isEquityMarketOffHours } from 'uniswap/src/features/rwa/equityMarketHours'
import { getRWACandidatesFromCurrency } from 'uniswap/src/features/rwa/rwaCandidates'
import { findRWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import type { RWAWhitelist } from 'uniswap/src/features/rwa/types'

// The "Large price difference" warning shows above this price impact; mirror getPriceImpactWarning's
// medium threshold (a percent) in basis points to match what the UI actually displays.
const PRICE_IMPACT_WARNING_BASIS_POINTS = PRICE_IMPACT_WARNING_THRESHOLD * 100

function isTokenizedStock(currency: Currency, rwaWhitelist: RWAWhitelist): boolean {
  const match = findRWAMatch({ rwaWhitelist, candidates: getRWACandidatesFromCurrency(currency) })
  return match?.asset.category === RwaCategory.STOCKS
}

/**
 * Builds the RWA swap analytics properties shared by the swap funnel events. `market_closed` and
 * `price_warning` are always derivable from the trade; the stock flags require the RWA whitelist, so
 * callers without it (e.g. saga contexts) omit it and those two fields stay undefined.
 */
export function getRwaSwapAnalyticsProperties({
  inputCurrency,
  outputCurrency,
  priceImpactBasisPoints,
  rwaWhitelist,
}: {
  inputCurrency: Currency
  outputCurrency: Currency
  priceImpactBasisPoints?: string | number
  rwaWhitelist?: RWAWhitelist
}): {
  market_closed: boolean
  price_warning: boolean
  token_in_stocks?: boolean
  token_out_stocks?: boolean
} {
  const impactBps = priceImpactBasisPoints === undefined ? undefined : Number(priceImpactBasisPoints)

  return {
    market_closed: isEquityMarketOffHours(new Date()),
    price_warning:
      impactBps !== undefined && Number.isFinite(impactBps) && impactBps > PRICE_IMPACT_WARNING_BASIS_POINTS,
    token_in_stocks: rwaWhitelist ? isTokenizedStock(inputCurrency, rwaWhitelist) : undefined,
    token_out_stocks: rwaWhitelist ? isTokenizedStock(outputCurrency, rwaWhitelist) : undefined,
  }
}
