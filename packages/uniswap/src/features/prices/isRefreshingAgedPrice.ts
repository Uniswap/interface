import { MAX_DISPLAYABLE_PRICE_AGE_MS } from '@universe/prices'

/**
 * True while a fetch is replacing price data older than MAX_DISPLAYABLE_PRICE_AGE_MS, e.g. a day-old
 * entry rehydrated from the persisted query cache during its mount refetch. Withhold that data and show
 * the loading state instead, so it never renders as current. Placeholder data (keepPreviousData) is
 * exempt: its `dataUpdatedAt` belongs to the new key, which has nothing cached yet. Errored queries are
 * exempt too: `isError` holds through later refetches until one succeeds, so an outage keeps showing
 * the last data instead of blanking it on every poll.
 */
export function isRefreshingAgedPrice({
  dataUpdatedAt,
  isError,
  isFetching,
  isPlaceholderData,
}: {
  dataUpdatedAt: number
  isError: boolean
  isFetching: boolean
  isPlaceholderData: boolean
}): boolean {
  return isFetching && !isError && !isPlaceholderData && Date.now() - dataUpdatedAt > MAX_DISPLAYABLE_PRICE_AGE_MS
}
