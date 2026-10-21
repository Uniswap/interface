import type { MarginQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { marginMarketKey, type MarginMarket } from '~/constants/margin'
import { MarginRateRows } from '~/pages/Swap/Margin/components/MarginRateRows'
import type { DerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'
import { render } from '~/test-utils/render'

vi.mock('uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore', () => ({
  useMarginFormStore: (
    selector: (s: { slippageToleranceBps: number; excludedVenues: string[]; pairKey: string }) => unknown,
  ) => selector({ slippageToleranceBps: 50, excludedVenues: [], pairKey: 'usdc-weth' }),
  useMarginFormStoreActions: () => ({ setMarginFormState: vi.fn() }),
}))

// The fixture quote below carries no paymentSwap route, so the route-symbol resolver never gets
// invoked — an empty registry avoids hitting the live markets query. The registry tests below swap in
// their own markets/marks.
const registry = vi.hoisted(() => ({
  markets: [] as MarginMarket[],
  live: new Map<string, { markPriceX18: string }>(),
  // The freshness bound reads this. Omitting it made every case evaluate the poll as never-fetched,
  // so the delayed-price disclosure was never exercised and passing the wrong field kept the suite green.
  dataUpdatedAt: 0,
}))

vi.mock('~/pages/Swap/Margin/hooks/useMarginMarkets', () => ({
  useMarginMarkets: () => ({
    markets: registry.markets,
    groups: [],
    getMarketByTokens: ({ venue }: { venue?: string }) => registry.markets.find((m) => m.venue === venue),
    getLive: (key: string | undefined) => (key ? registry.live.get(key) : undefined),
    dataUpdatedAt: registry.dataUpdatedAt,
  }),
}))

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const keyFor = (venue: MarginVenue): string => marginMarketKey({ collateralToken: USDC, debtToken: WETH, venue })

// A short: collateral is the USD-stable leg (USDC), debt is the volatile leg (WETH). The key is the
// real computed one, so a lookup that wrongly falls back to this market still finds its live mark —
// without that, the miss test would pass even against the fallback it exists to forbid.
const SHORT_MARKET: MarginMarket = {
  key: keyFor('MORPHO'),
  asset: 'ETH',
  name: 'Ethereum',
  displaySymbol: 'USDC',
  collateral: { address: USDC, symbol: 'USDC', decimals: 6 },
  debt: { address: WETH, symbol: 'WETH', decimals: 18 },
  venue: 'MORPHO',
  lltvWad: '860000000000000000',
  shouldUseNativeEquity: false,
}

const QUOTE: MarginQuoteResponse = {
  requestId: 'r1',
  action: 'open',
  chainId: 1,
  swapper: '0x0000000000000000000000000000000000000001',
  direction: 'SHORT',
  exposureToken: { address: SHORT_MARKET.debt.address, chainId: 1, decimals: 18 },
  counterToken: { address: SHORT_MARKET.collateral.address, chainId: 1, decimals: 6 },
  display: { effectivePrice: `${3000n * 10n ** 18n}` },
  legs: [],
  deadlineSuggestion: '0',
  gasEstimate: { gasLimit: '200000', gasFeeWei: '1000000000000000' },
}

function derivedMarginInfoFixture(): DerivedMarginInfo {
  return {
    market: SHORT_MARKET,
    direction: 'SHORT',
    quote: QUOTE,
    paymentToken: { symbol: 'USDC' },
  } as unknown as DerivedMarginInfo
}

describe('MarginRateRows', () => {
  beforeEach(() => {
    registry.markets = []
    registry.live = new Map()
    registry.dataUpdatedAt = Date.now()
  })

  // The unit (base) and denomination (quote) are independent legs — both must be asserted, since a
  // unit-only fix would still repeat the volatile leg on the denomination side.
  it('quotes a short entry price as 1 <base> = <n> <quote>, both unwrapped', () => {
    const { container } = render(<MarginRateRows derivedMarginInfo={derivedMarginInfoFixture()} />)
    expect(container.textContent).toMatch(/1 ETH = [\d,.]+ USDC/)
    expect(container.textContent).not.toContain('WETH')
  })

  // '0' is the wire's absent sentinel and a truthy STRING, so an unguarded read renders the headline
  // of the collapsed rate area as `1 ETH = 0 USDC ($0.00)` — a real price, not a hidden row.
  it('hides the entry price rather than quoting the zero sentinel as a real one', () => {
    const info = derivedMarginInfoFixture()
    const zeroed = {
      ...info,
      quote: { ...QUOTE, display: { ...QUOTE.display, effectivePrice: '0' } },
    } as unknown as DerivedMarginInfo
    const { container } = render(<MarginRateRows derivedMarginInfo={zeroed} />)
    expect(container.textContent).not.toContain('1 ETH = 0')
    expect(container.textContent).not.toContain('$0.00')
  })

  // A mark 10% away from the fill, which clears the 5% warning threshold.
  const MARK_X18 = `${3300n * 10n ** 18n}`

  function renderRoutedTo(venue: MarginVenue): HTMLElement {
    const info = derivedMarginInfoFixture()
    const quote = { ...QUOTE, legs: [{ venue }] } as unknown as MarginQuoteResponse
    return render(<MarginRateRows derivedMarginInfo={{ ...info, quote }} />).container
  }

  // Only the MORPHO market is registered, and only it carries a mark.
  function registerMorphoOnly(): void {
    registry.markets = [SHORT_MARKET]
    registry.live = new Map([[keyFor('MORPHO'), { markPriceX18: MARK_X18 }]])
  }

  it('prices impact against the ROUTED venue mark', () => {
    registerMorphoOnly()
    expect(renderRoutedTo('MORPHO').textContent).toContain('Price difference')
  })

  // The row must not fall back to the form market's mark: that compares one venue's fill against
  // another's, which fabricates or suppresses the very warning the row exists to give. Guards the
  // positive case above from passing for the wrong reason.
  it('hides the impact row when the registry has no market for the routed venue', () => {
    registerMorphoOnly()
    expect(renderRoutedTo('AAVE_V3').textContent).not.toContain('Price difference')
  })

  // The impact row is the one figure exempted from the freshness bound, and that exemption is only
  // defensible because the row DISCLOSES the delay. On the form's fee list too — not just the review
  // sheet, which is the surface the exemption's docstring names.
  // Other rows on this list carry their own tooltips, so the assertion has to name THIS row's trigger.
  function impactRowHasCaption(container: HTMLElement): boolean {
    return [...container.querySelectorAll('[data-base-ui-tooltip-trigger]')].some((el) =>
      el.textContent.includes('Price difference'),
    )
  }

  it('still prices impact against an aged mark, and captions it as delayed', () => {
    registerMorphoOnly()
    registry.dataUpdatedAt = Date.now() - 10 * 60_000
    const container = renderRoutedTo('MORPHO')
    expect(container.textContent).toContain('Price difference')
    expect(impactRowHasCaption(container)).toBe(true)
  })

  it('leaves the row uncaptioned while the poll is fresh', () => {
    registerMorphoOnly()
    const container = renderRoutedTo('MORPHO')
    expect(container.textContent).toContain('Price difference')
    expect(impactRowHasCaption(container)).toBe(false)
  })
})
