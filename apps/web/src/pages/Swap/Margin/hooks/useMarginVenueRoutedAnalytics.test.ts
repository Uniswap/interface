import { renderHook } from '@testing-library/react'
import { FetchError } from '@universe/api'
import type { MarginQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { MarginDirection, type MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMarginVenueRoutedAnalytics } from '~/pages/Swap/Margin/hooks/useMarginVenueRoutedAnalytics'

const { mockSendAnalyticsEvent } = vi.hoisted(() => ({ mockSendAnalyticsEvent: vi.fn() }))
vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: mockSendAnalyticsEvent }))

const PAIR_KEY = '0xweth-0xusdc'

function quoteWithVenue(venue: MarginVenue): MarginQuoteResponse {
  return { requestId: 'r1', legs: [{ venue }] } as unknown as MarginQuoteResponse
}

type Props = Parameters<typeof useMarginVenueRoutedAnalytics>[0]

function baseProps(overrides: Partial<Props> = {}): Props {
  return {
    pairKey: PAIR_KEY,
    direction: MarginDirection.LONG,
    quote: quoteWithVenue('MORPHO'),
    quoteError: null,
    allowedVenues: ['AAVE_V3', 'MORPHO'],
    excludedCount: 0,
    leverage: 2,
    equityUsd: 1000,
    enabled: true,
    ...overrides,
  }
}

function renderAnalytics(props: Props): ReturnType<typeof renderHook<void, Props>> {
  return renderHook((p: Props) => useMarginVenueRoutedAnalytics(p), { initialProps: props })
}

describe('useMarginVenueRoutedAnalytics', () => {
  beforeEach(() => {
    mockSendAnalyticsEvent.mockReset()
  })

  it('reports the routed venue with the allowlist it was asked with', () => {
    renderAnalytics(baseProps())
    expect(mockSendAnalyticsEvent).toHaveBeenCalledTimes(1)
    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(InterfaceEventName.MarginVenueRouted, {
      pairKey: PAIR_KEY,
      direction: MarginDirection.LONG,
      venue: 'MORPHO',
      allowlistSent: ['AAVE_V3', 'MORPHO'],
      excludedCount: 0,
      leverage: 2,
      // Notional is equity × leverage, the same identity the size preview shows.
      notionalUsd: 2000,
      rejectedReasons: undefined,
    })
  })

  // The quote polls every ~15s; an event per poll would drown the real signal.
  it('does not re-fire while the routed venue holds across a poll', () => {
    const { rerender } = renderAnalytics(baseProps())
    rerender(baseProps({ quote: quoteWithVenue('MORPHO') }))
    rerender(baseProps({ quote: quoteWithVenue('MORPHO'), leverage: 3 }))
    expect(mockSendAnalyticsEvent).toHaveBeenCalledTimes(1)
  })

  it('fires again when the server routes elsewhere, carrying the live payload', () => {
    const { rerender } = renderAnalytics(baseProps())
    rerender(baseProps({ quote: quoteWithVenue('AAVE_V3'), leverage: 4, allowedVenues: ['AAVE_V3'], excludedCount: 1 }))
    expect(mockSendAnalyticsEvent).toHaveBeenCalledTimes(2)
    expect(mockSendAnalyticsEvent).toHaveBeenLastCalledWith(
      InterfaceEventName.MarginVenueRouted,
      expect.objectContaining({ venue: 'AAVE_V3', allowlistSent: ['AAVE_V3'], excludedCount: 1, notionalUsd: 4000 }),
    )
  })

  it('stays silent with no quote and no rejection', () => {
    renderAnalytics(baseProps({ quote: undefined }))
    expect(mockSendAnalyticsEvent).not.toHaveBeenCalled()
  })

  // Selection admitting nobody is a routing outcome too, and its per-venue reasons have no other
  // reporting surface.
  it('reports a rejected allowlist with no venue', () => {
    const error = new FetchError({
      response: new Response(null, { status: 422 }),
      data: {
        errorCode: 'MARGIN_NO_ELIGIBLE_VENUE',
        details: {
          venues: [
            { venue: 'MORPHO', reason: 'LEVERAGE_TOO_HIGH' },
            { venue: 'AAVE_V3', reason: 'CAP_REACHED' },
          ],
        },
      },
    })
    renderAnalytics(baseProps({ quote: undefined, quoteError: error }))
    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
      InterfaceEventName.MarginVenueRouted,
      expect.objectContaining({
        venue: undefined,
        rejectedReasons: ['MORPHO:LEVERAGE_TOO_HIGH', 'AAVE_V3:CAP_REACHED'],
      }),
    )
  })

  it('ignores an unrelated quote failure', () => {
    renderAnalytics(
      baseProps({
        quote: undefined,
        quoteError: new FetchError({
          response: new Response(null, { status: 422 }),
          data: { errorCode: 'MARGIN_INVALID_LEVERAGE' },
        }),
      }),
    )
    expect(mockSendAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('omits notional when the equity has no USD price', () => {
    renderAnalytics(baseProps({ equityUsd: undefined }))
    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
      InterfaceEventName.MarginVenueRouted,
      expect.objectContaining({ notionalUsd: undefined }),
    )
  })
})

// The dedupe is per effect INSTANCE, so a second mount of the deriving hook is a second copy of every
// event. Opt-in keeps a non-reporting surface — the chart overlays mount the same hook just to read a
// field — silent, instead of silently doubling the funnel.
describe('useMarginVenueRoutedAnalytics — reporting mount', () => {
  it('emits nothing while disabled, and emits once when enabled', () => {
    mockSendAnalyticsEvent.mockClear()
    const disabled = renderHook(() => useMarginVenueRoutedAnalytics(baseProps({ enabled: false })))
    expect(mockSendAnalyticsEvent).not.toHaveBeenCalled()
    disabled.unmount()

    renderHook(() => useMarginVenueRoutedAnalytics(baseProps({ enabled: true })))
    expect(mockSendAnalyticsEvent).toHaveBeenCalledTimes(1)
  })
})

// The reason list is parsed in a RENDER body, so a malformed payload must degrade to "no reasons" —
// never throw the margin form into the error boundary over telemetry.
describe('noEligibleVenueReasons — malformed payloads', () => {
  function rejectedWith(venues: unknown): unknown {
    return new FetchError({
      response: new Response(JSON.stringify({}), { status: 422 }),
      data: { errorCode: 'MARGIN_NO_ELIGIBLE_VENUE', details: { venues } },
    })
  }

  it('reports no reasons rather than throwing on entries that are not objects', () => {
    mockSendAnalyticsEvent.mockClear()
    const quoteError = rejectedWith([null, 'MORPHO', 42])
    expect(() =>
      renderHook(() => useMarginVenueRoutedAnalytics(baseProps({ quote: undefined, quoteError }))),
    ).not.toThrow()
  })

  it('still reads the well-formed entries alongside malformed ones', () => {
    mockSendAnalyticsEvent.mockClear()
    const quoteError = rejectedWith([null, { venue: 'MORPHO', reason: 'LTV' }])
    renderHook(() => useMarginVenueRoutedAnalytics(baseProps({ quote: undefined, quoteError })))
    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ rejectedReasons: ['MORPHO:LTV'] }),
    )
  })
})
