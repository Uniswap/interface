import { fireEvent, screen } from '@testing-library/react'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import type { MarginQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MarginDirection, type MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MarginMarket } from '~/constants/margin'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { MarginOpenReviewModal } from '~/pages/Swap/Margin/components/MarginOpenReviewModal'
import type { DerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'
import { render } from '~/test-utils/render'

const MORPHO_MARKET = getDefaultMarginMarket() // WETH/USDC MORPHO, native equity, 86% LLTV
const AAVE_MARKET: MarginMarket = {
  ...MORPHO_MARKET,
  key: 'weth-usdc-AAVE_V3',
  venue: 'AAVE_V3',
  lltvWad: '770000000000000000',
}
const PAYMENT_RAW = '1000000000000000000'

const { SWAPPER, mockExecutePlan, mockUseIsPlanInFlight } = vi.hoisted(() => ({
  SWAPPER: '0x00000000000000000000000000000000000000A1',
  mockExecutePlan: vi.fn(),
  mockUseIsPlanInFlight: vi.fn(() => false),
}))

vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('~/hooks/useAccount', () => ({ useAccount: () => ({ address: SWAPPER }) }))

vi.mock('~/pages/Swap/Margin/hooks/useExecuteMarginPlan', () => ({
  useExecuteMarginPlan: () => ({ executePlan: mockExecutePlan }),
}))

vi.mock('~/pages/Swap/Margin/hooks/useIsPlanInFlight', () => ({ useIsPlanInFlight: mockUseIsPlanInFlight }))

vi.mock('~/pages/Swap/Margin/hooks/useMarginCurrencyInfos', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/pages/Swap/Margin/hooks/useMarginCurrencyInfos')>()),
  useMarginCurrencyInfos: () => new Map(),
}))

// Both venues back the same pair, so the sheet can resolve either one's market from the quote's venue.
// `venues` narrows that registry for the miss case below.
const registry = vi.hoisted(() => ({
  // 0 = never fetched, which isMarkStale treats as FRESH so nothing suppresses before first load.
  marketsUpdatedAt: 0,
  venues: ['MORPHO', 'AAVE_V3'] as string[],
  markPriceX18: undefined as string | undefined,
}))

vi.mock('~/pages/Swap/Margin/hooks/useMarginMarkets', () => ({
  // getLive backs the review sheet's price-impact and liquidation-distance figures; no live row means
  // no mark, so both hide and the pin assertions below are unaffected. `dataUpdatedAt` drives the
  // freshness bound — `registry.marketsUpdatedAt` lets a test age the poll out.
  useMarginMarkets: () => ({
    getMarketByTokens: ({ venue }: { venue?: string }) =>
      [MORPHO_MARKET, AAVE_MARKET].find((m) => m.venue === venue && registry.venues.includes(m.venue)),
    getLive: () => (registry.markPriceX18 ? { markPriceX18: registry.markPriceX18 } : undefined),
    dataUpdatedAt: registry.marketsUpdatedAt,
  }),
}))

// Two quotes that differ in the ONE way the pin exists for: the venue they route to. The gas figure
// rides along as a proxy for "the numbers the user is looking at".
function quoteFixture({ venue, gasFeeUsd }: { venue: MarginVenue; gasFeeUsd: string }): MarginQuoteResponse {
  return {
    requestId: `r-${venue}`,
    action: 'open',
    chainId: 1,
    swapper: SWAPPER,
    direction: MarginDirection.LONG,
    exposureToken: { address: MORPHO_MARKET.collateral.address, chainId: 1, decimals: 18 },
    counterToken: { address: MORPHO_MARKET.debt.address, chainId: 1, decimals: 6 },
    display: {
      size: `${2n * 10n ** 18n}`,
      leverage: '2',
      effectivePrice: `${3000n * 10n ** 18n}`,
    },
    legs: [{ venue, collateralToken: '', debtToken: '', equityShare: '1', bounds: {} }] as MarginQuoteResponse['legs'],
    deadlineSuggestion: '0',
    gasEstimate: { gasLimit: '200000', gasFeeWei: '1000000000000000', gasFeeUsd },
  }
}

const MORPHO_QUOTE = quoteFixture({ venue: 'MORPHO', gasFeeUsd: `${111n * 10n ** 16n}` }) // $1.11
const AAVE_QUOTE = quoteFixture({ venue: 'AAVE_V3', gasFeeUsd: `${999n * 10n ** 16n}` }) // $9.99

function derivedFixture(quote?: MarginQuoteResponse, over: { quoteError?: unknown } = {}): DerivedMarginInfo {
  return {
    market: MORPHO_MARKET,
    direction: MarginDirection.LONG,
    leverage: 2,
    quote,
    quoteError: over.quoteError,
    paymentAmountRaw: PAYMENT_RAW,
    paymentToken: { symbol: 'ETH' },
    paymentCurrency: { symbol: 'ETH' },
    paymentCurrencyInfo: { logoUrl: undefined },
    allowedVenues: ['AAVE_V3', 'MORPHO'],
    excludedCount: 0,
  } as unknown as DerivedMarginInfo
}

function renderReview(quote?: MarginQuoteResponse, over: { quoteError?: unknown } = {}): ReturnType<typeof render> {
  return render(<MarginOpenReviewModal derivedMarginInfo={derivedFixture(quote, over)} isOpen onClose={vi.fn()} />)
}

function rerenderWith({
  rerender,
  quote,
  isOpen = true,
}: {
  rerender: ReturnType<typeof render>['rerender']
  quote?: MarginQuoteResponse
  isOpen?: boolean
}): void {
  rerender(<MarginOpenReviewModal derivedMarginInfo={derivedFixture(quote)} isOpen={isOpen} onClose={vi.fn()} />)
}

const cta = (): HTMLElement => screen.getByRole('button', { name: 'Open long position' })

describe('MarginOpenReviewModal venue pin', () => {
  beforeEach(() => {
    registry.marketsUpdatedAt = 0
    vi.clearAllMocks()
    mockUseIsPlanInFlight.mockReturnValue(false)
    registry.venues = ['MORPHO', 'AAVE_V3']
    registry.markPriceX18 = undefined
  })

  // Every canConfirm term that can fail on its own must say so: a greyed Confirm with an empty footer
  // is a dead end the user cannot diagnose or escape (re-opening re-pins the same quote).
  // Its OWN cause, not the quote-failure copy: the quote arrived fine, and what is missing is a registry
  // entry for the venue it routed to. "Try again" would describe a loop — a re-quote re-routes to the
  // same venue and re-opening re-pins it.
  it('says why Confirm is shut when the registry has no market for the pinned venue', () => {
    registry.venues = ['AAVE_V3']
    renderReview(MORPHO_QUOTE)
    expect(cta()).toBeDisabled()
    expect(screen.getByText(/routed to a venue we can’t price right now/)).toBeInTheDocument()
    expect(screen.queryByText('Couldn’t fetch a quote. Try again.')).not.toBeInTheDocument()
  })

  // The other arm still says its own thing — the split must not collapse both into one message.
  it('keeps the quote-failure copy for an actual quote error', () => {
    renderReview(MORPHO_QUOTE, { quoteError: new Error('boom') })
    expect(screen.getByText('Couldn’t fetch a quote. Try again.')).toBeInTheDocument()
    expect(screen.queryByText(/routed to a venue we can’t price right now/)).not.toBeInTheDocument()
  })

  // The pairing this file lost twice. Both halves are needed: the reason cases prove a durable shut
  // always SAYS why, and the healthy case proves nothing shuts Confirm WITHOUT a reason — which is the
  // half that catches a durable term added to `canConfirm` alone (the actual failure mode both times).
  it.each([
    ['a quote error', { quoteError: new Error('boom') }],
    ['a venue the registry cannot price', undefined],
  ])('never greys Confirm without saying why (%s)', (_label, over) => {
    if (over === undefined) {
      registry.venues = ['AAVE_V3']
    }
    renderReview(MORPHO_QUOTE, over ?? {})
    expect(cta()).toBeDisabled()
    expect(
      screen.queryByText('Couldn’t fetch a quote. Try again.') ??
        screen.queryByText(/routed to a venue we can’t price right now/),
    ).toBeInTheDocument()
  })

  it('leaves Confirm live with no footer when nothing durable is wrong', () => {
    renderReview(MORPHO_QUOTE)
    expect(cta()).toBeEnabled()
    expect(screen.queryByText('Couldn’t fetch a quote. Try again.')).not.toBeInTheDocument()
    expect(screen.queryByText(/routed to a venue we can’t price right now/)).not.toBeInTheDocument()
  })

  it('names the venue the quote routed to, not the form’s pair-first market', () => {
    renderReview(AAVE_QUOTE)
    expect(screen.getByText('Aave v3 · 77% LLTV')).toBeInTheDocument()
    expect(cta()).not.toBeDisabled()
  })

  // Liquidation triggers off the ORACLE, and an open's fill is adverse to it — anchoring the distance
  // on the fill price would overstate the buffer by roughly the impact. Liq $2,400 against a $3,000
  // oracle mark is −20.0%; against the $3,000 fill it would coincide, so the mark is moved to $4,000
  // to tell the two apart (−40.0% oracle vs −20.0% fill).
  // The PRICE comes off the quote and needs no mark; only the suffix does. Gating the row on the
  // distance hid where the position liquidates on the last screen before funds move, with Confirm
  // still armed — a `"0"` mark is a reachable backend state.
  // getLive serves the last SUCCESSFUL markets poll with no age bound, so a failing refetch keeps
  // serving it. Both figures it feeds read SAFER when the mark lags, with Confirm armed — so past the
  // freshness bound it is treated as ABSENT and the distance falls through to the quote's own fill.
  // The resolver unit tests pin the exception, but swapping THIS call site back to the bounded mark
  // kept every suite green — which is exactly how the review sheet ended up on the bounded resolver
  // while the docstring justifying the exception named this surface. Impact cannot fall back to the
  // fill, so withholding an aged mark hides the row on the confirm screen with Confirm still armed.
  // Disclosing a delayed figure is only honest if it SAYS it is delayed — the tooltip is what makes
  // the allowStale exemption defensible rather than a silent downgrade.
  it('labels the impact as measured against a delayed price when the poll has aged out', () => {
    registry.markPriceX18 = `${2800n * 10n ** 18n}`

    // Fresh: the row renders with no tooltip affordance.
    registry.marketsUpdatedAt = Date.now()
    const fresh = renderReview(MORPHO_QUOTE).container
    expect(fresh.textContent).toContain('Price difference')
    const freshIcons = fresh.querySelectorAll('svg').length

    // Aged out: same row, plus the info affordance the tooltip adds. Paired, because a bare
    // "an icon exists" assertion passes on a page that is full of icons.
    registry.marketsUpdatedAt = Date.now() - 10 * 60_000
    const stale = renderReview(MORPHO_QUOTE).container
    expect(stale.textContent).toContain('Price difference')
    expect(stale.querySelectorAll('svg').length).toBeGreaterThan(freshIcons)
  })

  it('still discloses price impact once the markets poll has aged out', () => {
    // The fill must be ADVERSE to the mark for a BUY (exec − mark > 0): a $3,000 fill against a $2,800
    // mark is ~7.1%, clearing the row's 5% warning threshold.
    registry.markPriceX18 = `${2800n * 10n ** 18n}`
    registry.marketsUpdatedAt = Date.now() - 10 * 60_000
    renderReview(MORPHO_QUOTE)
    expect(screen.getByText('Price difference')).toBeInTheDocument()
  })

  it.each([
    { label: 'states the distance while the markets poll is fresh', agedOut: false, distance: true },
    { label: 'drops the distance once the markets poll has aged out', agedOut: true, distance: false },
  ])('$label', ({ agedOut, distance }) => {
    registry.markPriceX18 = `${4000n * 10n ** 18n}`
    registry.marketsUpdatedAt = agedOut ? Date.now() - 5 * 60_000 : Date.now()
    const quote = {
      ...MORPHO_QUOTE,
      display: { ...MORPHO_QUOTE.display, effectivePrice: undefined, liquidationPrice: `${2400n * 10n ** 18n}` },
    } as unknown as MarginQuoteResponse
    renderReview(quote)
    expect(screen.getByText(/\$2,400/)).toBeInTheDocument()
    // $2,400 against a $4,000 mark is −40%. The fresh leg proves the aged leg is suppressing something.
    if (distance) {
      expect(screen.getByText(/−40\.0%/)).toBeInTheDocument()
    } else {
      expect(screen.queryByText(/−40\.0%/)).toBeNull()
    }
  })

  it('still shows where the position liquidates when the venue publishes no usable mark', () => {
    registry.markPriceX18 = '0'
    const quote = {
      ...MORPHO_QUOTE,
      display: { ...MORPHO_QUOTE.display, effectivePrice: undefined, liquidationPrice: `${2400n * 10n ** 18n}` },
    } as unknown as MarginQuoteResponse
    renderReview(quote)
    expect(screen.getByText(/\$2,400/)).toBeInTheDocument()
    expect(screen.queryByText(/%\)/)).toBeNull()
  })

  it('measures the liquidation distance against the oracle mark, not the fill price', () => {
    registry.markPriceX18 = `${4000n * 10n ** 18n}`
    const quote = {
      ...MORPHO_QUOTE,
      display: { ...MORPHO_QUOTE.display, liquidationPrice: `${2400n * 10n ** 18n}` },
    }
    renderReview(quote)
    expect(screen.getByText(/\(−40\.0%\)/)).toBeInTheDocument()
    expect(screen.queryByText(/\(−20\.0%\)/)).toBeNull()
  })

  // A zero USD gas figure is a failed PRICING, not a free transaction: the fee is quoted in wei by the
  // same estimate, and rendering $0.00 would suppress the one real number on the row.
  it('falls through to the ETH gas figure when the USD one comes back as the zero sentinel', () => {
    renderReview(quoteFixture({ venue: 'MORPHO', gasFeeUsd: '0' }))
    expect(screen.queryByText('$0.00')).toBeNull()
    expect(screen.getByText('0.00100 ETH')).toBeInTheDocument()
  })

  it('lets same-venue polls update the figures in place', () => {
    const { rerender } = renderReview(MORPHO_QUOTE)
    rerenderWith({ rerender, quote: quoteFixture({ venue: 'MORPHO', gasFeeUsd: `${999n * 10n ** 16n}` }) })

    expect(screen.getByText('$9.99')).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.MarginReviewRouteChanged)).toBeNull()
    expect(cta()).not.toBeDisabled()
  })

  describe('when a poll re-routes to another venue', () => {
    function reroute(): ReturnType<typeof render> {
      const rendered = renderReview(MORPHO_QUOTE)
      rerenderWith({ rerender: rendered.rerender, quote: AAVE_QUOTE })
      return rendered
    }

    it('holds the reviewed figures instead of swapping them underneath', () => {
      reroute()
      expect(screen.getByText('$1.11')).toBeInTheDocument()
      expect(screen.queryByText('$9.99')).toBeNull()
      expect(screen.getByText('Morpho · 86% LLTV')).toBeInTheDocument()
    })

    it('closes Confirm and offers the new route instead', () => {
      reroute()
      expect(cta()).toBeDisabled()
      expect(screen.getByTestId(TestID.MarginReviewRouteChanged).textContent).toBe('Route changed to Aave v3 · Review')
    })

    // The whole point: a plan must never be minted on a venue the user has not seen.
    it('mints nothing while held', () => {
      reroute()
      fireEvent.click(cta())
      expect(mockExecutePlan).not.toHaveBeenCalled()
    })

    it('adopts the new route on press — figures, venue and Confirm all move together', () => {
      reroute()
      fireEvent.click(screen.getByTestId(TestID.MarginReviewRouteChanged))

      expect(screen.getByText('$9.99')).toBeInTheDocument()
      expect(screen.getByText('Aave v3 · 77% LLTV')).toBeInTheDocument()
      expect(screen.queryByTestId(TestID.MarginReviewRouteChanged)).toBeNull()
      expect(cta()).not.toBeDisabled()
    })

    it('creates the adopted quote once it has been reviewed', () => {
      reroute()
      fireEvent.click(screen.getByTestId(TestID.MarginReviewRouteChanged))
      fireEvent.click(cta())

      expect(mockExecutePlan).toHaveBeenCalledTimes(1)
      expect(mockExecutePlan.mock.calls[0]?.[0].request.marginQuote).toBe(AAVE_QUOTE)
    })
  })

  // Held-then-returned: the poll goes back to the pinned venue on its own, so there is nothing left
  // to adopt and the modal must release itself rather than wait for a press that will never come.
  it('releases the hold when a later poll routes back to the pinned venue', () => {
    const { rerender } = renderReview(MORPHO_QUOTE)
    rerenderWith({ rerender, quote: AAVE_QUOTE })
    expect(cta()).toBeDisabled()

    rerenderWith({ rerender, quote: quoteFixture({ venue: 'MORPHO', gasFeeUsd: `${222n * 10n ** 16n}` }) })
    expect(cta()).not.toBeDisabled()
    expect(screen.queryByTestId(TestID.MarginReviewRouteChanged)).toBeNull()
    expect(screen.getByText('$2.22')).toBeInTheDocument()
  })

  // A transient quote gap (the wallet disconnecting under the open sheet, then reconnecting to a
  // re-routed quote) must not drop the pin. Without the survival guard, pinnedQuote advances through
  // undefined, forgets MORPHO, and silently adopts AAVE with Confirm open.
  it('survives a transient quote gap without adopting the next route', () => {
    const { rerender } = renderReview(MORPHO_QUOTE)
    rerenderWith({ rerender, quote: undefined })
    expect(cta()).toBeDisabled()

    rerenderWith({ rerender, quote: AAVE_QUOTE })
    expect(screen.getByTestId(TestID.MarginReviewRouteChanged).textContent).toBe('Route changed to Aave v3 · Review')
    expect(cta()).toBeDisabled()
  })

  it('posts the quote it is showing when nothing has re-routed', () => {
    renderReview(MORPHO_QUOTE)
    fireEvent.click(cta())

    expect(mockExecutePlan).toHaveBeenCalledWith({
      request: { chainId: 1, swapper: SWAPPER, marginQuote: MORPHO_QUOTE },
      venuePreference: { allowlistSent: ['AAVE_V3', 'MORPHO'], excludedCount: 0 },
    })
  })

  // The pin is mount-scoped, so it has to be taken at OPEN — pinning at form mount would hold the
  // very first quote of the session against every review that followed.
  it('re-pins on each open rather than at form mount', () => {
    const { rerender } = render(
      <MarginOpenReviewModal derivedMarginInfo={derivedFixture(MORPHO_QUOTE)} isOpen={false} onClose={vi.fn()} />,
    )
    expect(screen.queryByRole('button', { name: 'Open long position' })).toBeNull()

    rerenderWith({ rerender, quote: AAVE_QUOTE })
    expect(screen.getByText('Aave v3 · 77% LLTV')).toBeInTheDocument()
    expect(cta()).not.toBeDisabled()
  })

  describe('composition with the existing gates', () => {
    it('keeps Confirm closed while a plan is in flight, unheld', () => {
      mockUseIsPlanInFlight.mockReturnValue(true)
      renderReview(MORPHO_QUOTE)
      expect(cta()).toBeDisabled()
      expect(screen.getByText('Another action is in progress')).toBeInTheDocument()
    })

    it('keeps Confirm closed with no quote at all', () => {
      renderReview(undefined)
      expect(cta()).toBeDisabled()
      expect(screen.queryByTestId(TestID.MarginReviewRouteChanged)).toBeNull()
    })

    // A quote that vanishes mid-review is the quote gate's business — the pin must not turn that into
    // a permanently-held modal offering a route it cannot name.
    it('does not hold when the quote disappears under it', () => {
      const { rerender } = renderReview(MORPHO_QUOTE)
      rerenderWith({ rerender, quote: undefined })

      expect(screen.queryByTestId(TestID.MarginReviewRouteChanged)).toBeNull()
      expect(cta()).toBeDisabled()
    })
  })
})
