import { shortenAddress } from 'utilities/src/addresses'
import { describe, expect, it } from 'vitest'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import { buildMarginRouteSteps } from '~/pages/Swap/Margin/marginRouteSteps'

const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const UNKNOWN_ADDRESS = '0x1111111111111111111111111111111111111111'

// Stub resolver standing in for the live registry — WETH unwraps to ETH, matching the real
// resolver's display projection; anything else is unresolved.
const SYMBOLS_BY_ADDRESS: Record<string, string> = {
  [WETH_ADDRESS.toLowerCase()]: 'ETH',
  [USDC_ADDRESS.toLowerCase()]: 'USDC',
}
function resolveSymbol(address: string): string | undefined {
  return SYMBOLS_BY_ADDRESS[address.toLowerCase()]
}

function paymentSwap(route: string[]): {
  route: string[]
  feeBps: number
  impactBps: string
  expectedOut: string
  minOut: string
} {
  return { route, feeBps: 5, impactBps: '0', expectedOut: '0', minOut: '0' }
}

describe('buildMarginRouteSteps', () => {
  it('direct (pay collateral, same chain): open step only', () => {
    expect(
      buildMarginRouteSteps({ quote: {}, market: { venue: 'MORPHO' }, paymentTokenSymbol: 'WETH', resolveSymbol }),
    ).toEqual([{ type: 'open', venue: 'MORPHO' }])
  })

  it('mainnet pre-swap: swap (raw WETH, mainnet chain) then venue-accurate open', () => {
    expect(
      buildMarginRouteSteps({
        quote: { paymentSwap: paymentSwap([USDC_ADDRESS, WETH_ADDRESS]) },
        market: { venue: 'AAVE_V3' },
        paymentTokenSymbol: 'USDC',
        resolveSymbol,
      }),
    ).toEqual([
      { type: 'swap', fromSymbol: 'USDC', toSymbol: 'ETH', chainId: MARGIN_CHAIN_ID },
      { type: 'open', venue: 'AAVE_V3' },
    ])
  })

  it('multi-hop mainnet pre-swap collapses to first → last token', () => {
    const steps = buildMarginRouteSteps({
      quote: { paymentSwap: paymentSwap([USDC_ADDRESS, UNKNOWN_ADDRESS, WETH_ADDRESS]) },
      market: { venue: 'MORPHO' },
      paymentTokenSymbol: 'USDC',
      resolveSymbol,
    })
    expect(steps[0]).toEqual({ type: 'swap', fromSymbol: 'USDC', toSymbol: 'ETH', chainId: MARGIN_CHAIN_ID })
    expect(steps).toHaveLength(2)
  })

  it('cross-chain paying source USDC directly: bridge then mainnet swap then open', () => {
    expect(
      buildMarginRouteSteps({
        quote: {
          paymentSource: { chainId: 130, bridgeFeeBps: 12 },
          paymentSwap: paymentSwap([USDC_ADDRESS, WETH_ADDRESS]),
        },
        market: { venue: 'MORPHO' },
        paymentTokenSymbol: 'USDC',
        resolveSymbol,
      }),
    ).toEqual([
      { type: 'bridge', symbol: 'USDC', fromChainId: 130, toChainId: MARGIN_CHAIN_ID },
      { type: 'swap', fromSymbol: 'USDC', toSymbol: 'ETH', chainId: MARGIN_CHAIN_ID },
      { type: 'open', venue: 'MORPHO' },
    ])
  })

  it('cross-chain with source swap: all four steps in order', () => {
    expect(
      buildMarginRouteSteps({
        quote: {
          paymentSource: { chainId: 8453, swapRoute: [UNKNOWN_ADDRESS, USDC_ADDRESS], bridgeFeeBps: 37 },
          paymentSwap: paymentSwap([USDC_ADDRESS, WETH_ADDRESS]),
        },
        market: { venue: 'MORPHO' },
        paymentTokenSymbol: 'cbBTC',
        resolveSymbol,
      }),
    ).toEqual([
      { type: 'swap', fromSymbol: 'cbBTC', toSymbol: 'USDC', chainId: 8453 },
      { type: 'bridge', symbol: 'USDC', fromChainId: 8453, toChainId: MARGIN_CHAIN_ID },
      { type: 'swap', fromSymbol: 'USDC', toSymbol: 'ETH', chainId: MARGIN_CHAIN_ID },
      { type: 'open', venue: 'MORPHO' },
    ])
  })

  it('unknown mainnet route address falls back to a shortened address', () => {
    const steps = buildMarginRouteSteps({
      quote: { paymentSwap: paymentSwap([UNKNOWN_ADDRESS, WETH_ADDRESS]) },
      market: { venue: 'MORPHO' },
      paymentTokenSymbol: 'USDC',
      resolveSymbol,
    })
    expect(steps[0]).toEqual({
      type: 'swap',
      fromSymbol: shortenAddress({ address: UNKNOWN_ADDRESS }),
      toSymbol: 'ETH',
      chainId: MARGIN_CHAIN_ID,
    })
  })

  it('degenerate pre-swap route (< 2 hops) emits no swap step', () => {
    expect(
      buildMarginRouteSteps({
        quote: { paymentSwap: paymentSwap([WETH_ADDRESS]) },
        market: { venue: 'MORPHO' },
        paymentTokenSymbol: 'WETH',
        resolveSymbol,
      }),
    ).toEqual([{ type: 'open', venue: 'MORPHO' }])
  })
})
