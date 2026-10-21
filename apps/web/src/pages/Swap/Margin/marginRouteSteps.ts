import { normalizeTokenAddressForCache } from '@universe/chains'
import type { MarginQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MARGIN_NATIVE_TOKEN_ADDRESS } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { shortenAddress } from 'utilities/src/addresses'
import type { MarginMarket } from '~/constants/margin'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import type { MarginSymbolResolver } from '~/pages/Swap/Margin/marginTokenDisplay'

export type MarginRouteStep =
  | { type: 'swap'; fromSymbol: string; toSymbol: string; chainId: number }
  | { type: 'bridge'; symbol: string; fromChainId: number; toChainId: number }
  | { type: 'open'; venue: MarginVenue }

// Wire route hops are token addresses; the injected resolver maps them to symbols, falling back to a
// shortened address when it can't. Native ETH always resolves directly.
function lookupRouteSymbol({
  address,
  resolveSymbol,
}: {
  address: string
  resolveSymbol: MarginSymbolResolver
}): string {
  const lower = normalizeTokenAddressForCache(address)
  if (lower === MARGIN_NATIVE_TOKEN_ADDRESS) {
    return 'ETH'
  }
  return resolveSymbol(address) ?? shortenAddress({ address })
}

// Orders the quote's route legs for the tooltip: source swap → bridge → mainnet pre-swap → open.
// The source swap always lands on bridgeable USDC; the bridge always targets the margin chain.
export function buildMarginRouteSteps({
  quote,
  market,
  paymentTokenSymbol,
  resolveSymbol,
}: {
  // `legs` is optional here only so a fixture can omit it; on the wire it is required and carries the
  // routed venue.
  quote: Pick<MarginQuoteResponse, 'paymentSwap' | 'paymentSource'> & { legs?: MarginQuoteResponse['legs'] }
  market: Pick<MarginMarket, 'venue'>
  paymentTokenSymbol: string
  resolveSymbol: MarginSymbolResolver
}): MarginRouteStep[] {
  const { paymentSource, paymentSwap } = quote
  const steps: MarginRouteStep[] = []

  if (paymentSource) {
    if (paymentSource.swapRoute) {
      steps.push({ type: 'swap', fromSymbol: paymentTokenSymbol, toSymbol: 'USDC', chainId: paymentSource.chainId })
    }
    steps.push({ type: 'bridge', symbol: 'USDC', fromChainId: paymentSource.chainId, toChainId: MARGIN_CHAIN_ID })
  }

  if (paymentSwap && paymentSwap.route.length >= 2) {
    const first = paymentSwap.route.at(0)
    const last = paymentSwap.route.at(-1)
    if (first !== undefined && last !== undefined) {
      steps.push({
        type: 'swap',
        fromSymbol: lookupRouteSymbol({ address: first, resolveSymbol }),
        toSymbol: lookupRouteSymbol({ address: last, resolveSymbol }),
        chainId: MARGIN_CHAIN_ID,
      })
    }
  }

  // The routed venue is the server's pick, which need not be the pair's first market — the venue row
  // rendered above this breakdown reads the same field.
  steps.push({ type: 'open', venue: quote.legs?.[0]?.venue ?? market.venue })
  return steps
}
