import type { MarginQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MarginDirection, type MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MarginMarket } from '~/constants/margin'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { MarginSizeReceiptValue } from '~/pages/Swap/Margin/components/MarginSizeBlock'
import type { DerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'
import { render } from '~/test-utils/render'

const MARKET = getDefaultMarginMarket() // WETH/USDC MORPHO

// The routed venue's registry entry and its live mark, both swappable per test — the size's USD value is
// priced off the mark, and `'0'` is a reachable wire value.
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

vi.mock('~/features/margin/hooks/useMarginMarkets', () => ({
  useMarginMarkets: () => ({
    getMarketByTokens: ({ venue }: { venue?: MarginVenue }) =>
      venue === MARKET.venue ? ((registry.marketOverride as MarginMarket | undefined) ?? MARKET) : undefined,
    getLive: (key: string | undefined) =>
      key === MARKET.key && registry.markPriceX18 ? { markPriceX18: registry.markPriceX18 } : undefined,
    dataUpdatedAt: registry.marketsUpdatedAt,
  }),
}))

const FILL_X18 = `${3000n * 10n ** 18n}`

function quoteFixture(overrides: Partial<MarginQuoteResponse['display']> = {}): MarginQuoteResponse {
  return {
    requestId: 'r1',
    action: 'open',
    chainId: 1,
    swapper: '0x0000000000000000000000000000000000000001',
    direction: MarginDirection.LONG,
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
  direction: MarginDirection.SHORT,
  displaySymbol: 'USDC',
  collateral: MARKET.debt,
  debt: MARKET.collateral,
} as MarginMarket

// AnimatedNumber renders odometer reels with no accessible name, so read the combined text content.
function renderBlock(
  quote: MarginQuoteResponse,
  market: MarginMarket = MARKET,
  direction: MarginDirection = MarginDirection.LONG,
): { textContent: string } {
  const info = { market, direction, maxLeverage: 5, quote } as unknown as DerivedMarginInfo
  const { container } = render(<MarginSizeReceiptValue derivedMarginInfo={info} />)
  const labels = Array.from(container.querySelectorAll('[aria-label]')).map((el) => el.getAttribute('aria-label'))
  return { textContent: labels.length > 0 ? labels.join(' ') : container.textContent }
}

describe('MarginSizeReceiptValue', () => {
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
    const container = renderBlock(quoteFixture(), SHORT_MARKET, MarginDirection.SHORT)
    // 2 units of the exposure (WETH, unwrapped to ETH) at the $4,000 registry mark.
    expect(container.textContent).toContain('ETH')
    expect(container.textContent).not.toContain('USDC')
    expect(container.textContent).toMatch(/\$8,000/)
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

  // Falls back to the quote's own fill price when the registry has no entry for the ROUTED venue. The miss
  // has to come from the venue the QUOTE names (which is what `getMarketByTokens` is keyed on); passing a
  // different market prop leaves the mock returning MARKET and exercises nothing.
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
