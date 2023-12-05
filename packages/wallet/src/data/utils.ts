import { ApolloClient, NetworkStatus, NormalizedCacheObject, useApolloClient } from '@apollo/client'
import { useCallback } from 'react'

export function isNonPollingRequestInFlight(networkStatus: NetworkStatus): boolean {
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
export function isError(networkStatus: NetworkStatus, hasData: boolean): boolean {
  return !hasData && networkStatus !== NetworkStatus.loading
}

export function useRefetchQueries(): (
  include?: Parameters<ApolloClient<NormalizedCacheObject>['refetchQueries']>[0]['include']
) => void {
  const client = useApolloClient()

  return useCallback(
    async (
      include: Parameters<
        ApolloClient<NormalizedCacheObject>['refetchQueries']
      >[0]['include'] = 'active'
    ) => {
      await client?.refetchQueries({ include })
    },
    [client]
  )
}
