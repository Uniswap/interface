import { NetworkStatus } from '@apollo/client'
import { QueryStatus } from '@tanstack/react-query'

export function isNonPollingRequestInFlight(networkStatus: NetworkStatus): boolean {
  return (
    networkStatus === NetworkStatus.loading ||
    networkStatus === NetworkStatus.setVariables ||
    networkStatus === NetworkStatus.refetch
  )
}

// maps GraphQL NetworkStatus to React Query QueryStatus to preserve compatibility while we support both endpoints
export function mapGraphQLNetworkStatusToReactQueryStatus(networkStatus: NetworkStatus): QueryStatus {
  switch (networkStatus) {
    case NetworkStatus.ready:
    case NetworkStatus.fetchMore:
    case NetworkStatus.refetch:
      return 'success'
    case NetworkStatus.loading:
    case NetworkStatus.setVariables:
      return 'pending'
    case NetworkStatus.error:
      return 'error'
    default:
      return 'success'
  }
}

/**
 * Consider a query in an error state for UI purposes if query has no data, and
 * query has been loading at least once.
 */
export function isError(networkStatus: NetworkStatus, hasData: boolean): boolean {
  return !hasData && networkStatus !== NetworkStatus.loading
}
