import { NetworkStatus } from '@apollo/client'

export function isNonPollingRequestInFlight(networkStatus: NetworkStatus) {
  return networkStatus === NetworkStatus.loading || networkStatus === NetworkStatus.refetch
}

/**
 * Consider a query in an error state for UI purposes if query has no data, and
 * query has been loading at least once.
 */
export function isError(networkStatus: NetworkStatus, hasData: boolean) {
  return !hasData && networkStatus !== NetworkStatus.loading
}
