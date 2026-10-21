import type { MarginQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MarginMarket } from '~/constants/margin'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { MarginSizeBlock } from '~/pages/Swap/Margin/components/MarginSizeBlock'
import type { DerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'
import { render } from '~/test-utils/render'

const MARKET = getDefaultMarginMarket() // WETH/USDC MORPHO

// The routed venue's registry entry and its live mark, both swappable per test — the block's size
// valuation and liquidation distance are both priced off the mark, and `'0'` is a reachable wire value.
const registry = vi.hoisted(() => ({
  markPriceX18: undefined as string | undefined,
  // Lets a test swap in a SHORT-shaped market; the mock below keys on venue, which both share.
  marketOverride: undefined as unknown,
  // 0 = never fetched, which the freshness rule treats as FRESH so nothing hides before first load.
  marketsUpdatedAt: 0,
}))

vi.mock('uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore', () => ({
  useMarginFormStore: (selector: (s: { leverage: number }) => unknown) => selector({ leverage: 2 }),
  useMarginFormStoreActions: () => ({ setMarginFormState: vi.fn() }),
}))

vi.mock('~/pages/Swap/Margin/hooks/useMarginCurrencyInfos', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/pages/Swap/Margin/hooks/useMarginCurrencyInfos')>()),
  useMarginCurrencyInfos: () => new Map(),
}))

vi.mock('~/pages/Swap/Margin/hooks/useMarginMarkets', () => ({
  useMarginMarkets: () => ({
    getMarketByTokens: ({ venue }: { venue?: MarginVenue }) =>
      venue === MARKET.venue ? ((registry.marketOverride as MarginMarket | undefined) ?? MARKET) : undefined,
    getLive: (key: string | undefined) =>
      key === MARKET.key && registry.markPriceX18 ? { markPriceX18: registry.markPriceX18 } : undefined,
    dataUpdatedAt: registry.marketsUpdatedAt,
  }),
}))

const FILL_X18 = `${3000n * 10n ** 18n}`
const LIQ_X18 = `${2400n * 10n ** 18n}`

function quoteFixture(overrides: Partial<MarginQuoteResponse['display']> = {}): MarginQuoteResponse {
  return {
    requestId: 'r1',
    action: 'open',
    chainId: 1,
    swapper: '0x0000000000000000000000000000000000000001',
    direction: 'LONG',
    exposureToken: { address: MARKET.collateral.address, chainId: 1, decimals: 18 },
    counterToken: { address: MARKET.debt.address, chainId: 1, decimals: 6 },
    display: { size: `${2n * 10n ** 18n}`, leverage: '2', effectivePrice: FILL_X18, ...overrides },
    legs: [{ venue: MARKET.venue }],
    deadlineSuggestion: '0',
    gasEstimate: { gasLimit: '200000', gasFeeWei: '1000000000000000' },
  } as unknown as MarginQuoteResponse
}

// A SHORT market's collateral is the stable leg, so its EXPOSURE is the debt leg — which is what the
// size figure is denominated in and valued against.
const SHORT_MARKET = {
  ...MARKET,
  direction: 'SHORT',
  displaySymbol: 'USDC',
  collateral: MARKET.debt,
  debt: MARKET.collateral,
} as MarginMarket

function renderBlock(
  quote: MarginQuoteResponse,
  market: MarginMarket = MARKET,
  direction: 'LONG' | 'SHORT' = 'LONG',
): HTMLElement {
  const info = { market, direction, maxLeverage: 5, quote } as unknown as DerivedMarginInfo
  return render(<MarginSizeBlock derivedMarginInfo={info} />).container
}

describe('MarginSizeBlock', () => {
  beforeEach(() => {
    registry.markPriceX18 = undefined
    registry.marketOverride = undefined
    registry.marketsUpdatedAt = 0
  })

  // Without this the marketsUpdatedAt wiring is unverified: the mock returned no dataUpdatedAt, so
  // every mark-dependent assertion ran with it undefined and passing the WRONG field here stayed green.
  // A registry mark 33% away from the fill makes the two sources distinguishable.
  it('falls back to the fill price once the markets poll has aged out', () => {
    registry.markPriceX18 = `${4000n * 10n ** 18n}`
    registry.marketsUpdatedAt = Date.now()
    expect(renderBlock(quoteFixture()).textContent).toMatch(/\$8,000/)

    registry.marketsUpdatedAt = Date.now() - 10 * 60_000
    const aged = renderBlock(quoteFixture()).textContent
    // 2 units at the $3,000 FILL, not the aged $4,000 mark.
    expect(aged).toMatch(/\$6,000/)
    expect(aged).not.toMatch(/\$8,000/)
  })

  // Direction picks the leg the size is denominated in and valued against: a SHORT's exposure is its
  // DEBT leg. Reading the collateral leg for both would label a short's size with the stable's symbol
  // and, with different decimals, scale it by the gap between them.
  it('values a SHORT against its debt leg, not the collateral one', () => {
    registry.marketOverride = SHORT_MARKET
    registry.markPriceX18 = `${4000n * 10n ** 18n}`
    const container = renderBlock(quoteFixture(), SHORT_MARKET, 'SHORT')
    // 2 units of the exposure (WETH, unwrapped to ETH) at the $4,000 registry mark.
    expect(container.textContent).toContain('ETH')
    expect(container.textContent).not.toContain('USDC')
    expect(container.textContent).toMatch(/\$8,000/)
  })

  // Liquidation triggers off the ORACLE, and an open's fill is adverse to it — anchoring the distance
  // on the fill overstates the buffer by roughly the impact. Liq $2,400 against a $4,000 oracle mark is
  // −40.0%; against the $3,000 fill it would read −20.0%, so the two are distinguishable.
  it('measures the liquidation distance against the routed venue’s oracle mark, not the fill price', () => {
    registry.markPriceX18 = `${4000n * 10n ** 18n}`
    const container = renderBlock(quoteFixture({ liquidationPrice: LIQ_X18 }))
    expect(container.textContent).toMatch(/\(−40\.0%\)/)
    expect(container.textContent).not.toMatch(/\(−20\.0%\)/)
  })

  // The PRICE comes off the quote and needs no mark; only the suffix does. Gating the row on the
  // distance hid where the position liquidates whenever the venue published no usable mark.
  it('still shows where the position liquidates when the venue publishes no usable mark', () => {
    registry.markPriceX18 = '0'
    const container = renderBlock(quoteFixture({ liquidationPrice: LIQ_X18, effectivePrice: undefined }))
    expect(container.textContent).toMatch(/\$2,400/)
    expect(container.textContent).not.toMatch(/%\)/)
  })

  // `'0'` is a truthy STRING on both the mark and the fill-price fallback, so an unguarded read renders
  // a $0.00 valuation beside a real token amount.
  it('does not value the size at $0.00 when both the mark and the fill price are the zero sentinel', () => {
    registry.markPriceX18 = '0'
    const container = renderBlock(quoteFixture({ effectivePrice: '0' }))
    expect(container.textContent).not.toMatch(/\$0\.00/)
  })

  // BigInt throws a SyntaxError on a non-integer wire string; unguarded, that takes the whole block
  // down mid-render (a blank terminal) instead of hiding one figure.
  it.each(['1.5', '', '1e18', 'nope'])('survives a non-integer size on the wire (%s)', (size) => {
    const container = renderBlock(quoteFixture({ size }))
    expect(container).toBeTruthy()
    expect(container.textContent).not.toMatch(/\$0\.00/)
  })

  // Falls back to the quote's own fill price when the registry has no entry for the ROUTED venue —
  // the impact row has no mark to contradict it in that state either. The miss has to come from the
  // venue the QUOTE names (which is what `getMarketByTokens` is keyed on); passing a different market
  // prop leaves the mock returning MARKET and exercises nothing.
  it('values the size off the fill price when the registry has no market for the routed venue', () => {
    registry.markPriceX18 = `${4000n * 10n ** 18n}`
    const routedElsewhere = {
      ...quoteFixture(),
      legs: [{ venue: 'AAVE_V3' }],
    } as unknown as MarginQuoteResponse
    const container = renderBlock(routedElsewhere)
    // $6,000 is 2 ETH at the $3,000 FILL. Valued at the $4,000 registry mark it would read $8,000, so
    // the two are distinguishable and the fallback is what produced this.
    expect(container.textContent).toMatch(/\$6,000/)
    expect(container.textContent).not.toMatch(/\$8,000/)
  })
})
