import { FetchError } from '@universe/api'
import { useEffect } from 'react'
import type {
  MarginNoEligibleVenueDetails,
  MarginQuoteResponse,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { MarginDirection, MarginPairKey, MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { useEvent } from 'utilities/src/react/hooks'

// The 422 the selection policy raises when it admitted nobody. Its per-venue reasons are the only
// place a rejection is ever reported, so they ride the same event as a successful route. An
// unrecognized body simply reports no reasons — the event's venue-change half is unaffected. This
// runs in the render body, so the shape check has to cover a present `details` with an absent or
// non-array `venues`, not just an absent `details`.
function noEligibleVenueReasons(error: unknown): string[] | undefined {
  if (!(error instanceof FetchError)) {
    return undefined
  }
  const body = error.data as { errorCode?: string; details?: MarginNoEligibleVenueDetails } | undefined
  if (body?.errorCode !== 'MARGIN_NO_ELIGIBLE_VENUE') {
    return undefined
  }
  // Element-checked, not just Array.isArray: this runs in a RENDER body, so a malformed payload whose
  // `venues` holds a null or a bare string would throw on the destructure and take the margin form to
  // the error boundary — over telemetry. A reason list that cannot be read is an empty one.
  // Widened to unknown[] before filtering: the declared element type is what the contract PROMISES, and
  // this whole function exists because an error body may not honour it. Without the widening the guard
  // reads as dead code to the type-aware lint, which is the same false confidence.
  return Array.isArray(body.details?.venues)
    ? (body.details.venues as unknown[])
        .filter((entry): entry is MarginNoEligibleVenueDetails['venues'][number] => {
          return typeof entry === 'object' && entry !== null && 'venue' in entry && 'reason' in entry
        })
        .map(({ venue, reason }) => `${venue}:${reason}`)
    : []
}

// Reports the OUTCOME of venue selection, on change only. The quote polls every ~15s and re-prices on
// every slider move; what is worth an event is the routed venue actually moving (or the allowlist
// being rejected outright), so the effect keys on that outcome alone and reads the rest of the
// payload live at fire time.
export function useMarginVenueRoutedAnalytics({
  pairKey,
  direction,
  quote,
  quoteError,
  allowedVenues,
  excludedCount,
  leverage,
  equityUsd,
  enabled,
}: {
  pairKey: MarginPairKey
  direction: MarginDirection
  quote?: MarginQuoteResponse
  quoteError: unknown
  allowedVenues: MarginVenue[]
  excludedCount: number
  leverage: number
  // Equity in USD; notional is that times leverage, the same identity the size preview shows.
  equityUsd?: number
  // The reporting mount. The dedupe below is per effect INSTANCE, so every extra mount of the hook that
  // derives these values is another copy of every event — and that hook has two mount sites on the
  // terminal (the form and the chart overlays), both of which look free because react-query dedupes the
  // FETCH. Opt-in rather than opt-out so a new consumer is silent until it says otherwise.
  enabled: boolean
}): void {
  const routedVenue = quote?.legs[0]?.venue
  const rejectedReasons = routedVenue ? undefined : noEligibleVenueReasons(quoteError)
  const outcome = routedVenue ?? (rejectedReasons ? `rejected:${rejectedReasons.join('|')}` : undefined)

  const report = useEvent((): void => {
    sendAnalyticsEvent(InterfaceEventName.MarginVenueRouted, {
      pairKey,
      direction,
      venue: routedVenue,
      allowlistSent: allowedVenues,
      excludedCount,
      leverage,
      notionalUsd: equityUsd === undefined ? undefined : equityUsd * leverage,
      rejectedReasons,
    })
  })

  useEffect(() => {
    if (!outcome || !enabled) {
      return
    }
    report()
    // Deliberately narrow: only a change of pair, direction or routing outcome is an event. Every
    // other field is read fresh inside `report`, whose identity is stable.
  }, [pairKey, direction, outcome, report, enabled])
}
