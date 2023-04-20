import { ApolloError, NetworkStatus } from '@apollo/client'
import { useEffect, useState } from 'react'

export function isNonPollingRequestInFlight(
  networkStatus: NetworkStatus
): boolean {
  return (
    networkStatus === NetworkStatus.loading ||
    networkStatus === NetworkStatus.setVariables ||
    networkStatus === NetworkStatus.refetch
  )
}

export function isWarmLoadingStatus(networkStatus: NetworkStatus): boolean {
  return networkStatus === NetworkStatus.loading
}

/**
 * Consider a query in an error state for UI purposes if query has no data, and
 * query has been loading at least once.
 */
export function isError(
  networkStatus: NetworkStatus,
  hasData: boolean
): boolean {
  return !hasData && networkStatus !== NetworkStatus.loading
}

/*
Apollo client clears errors when repolling, so if there's an error and we have a 
polling interval defined for the endpoint, then `error` will flicker between
being defined and not defined. This hook helps persist returned errors when polling
until the network request returns.

Feature request to enable persisted errors: https://github.com/apollographql/apollo-feature-requests/issues/348
*/
export function usePersistedError(
  loading: boolean,
  error?: ApolloError
): ApolloError | undefined {
  const [persistedError, setPersistedError] = useState<ApolloError>()

  useEffect(() => {
    if (error || !loading) {
      setPersistedError(error)
      return
    }
  }, [error, loading, setPersistedError])

  return persistedError
}
