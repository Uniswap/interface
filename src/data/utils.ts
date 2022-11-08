import { NetworkStatus } from '@apollo/client'

export function isNonPollingRequestInFlight(networkStatus: NetworkStatus) {
  return networkStatus === NetworkStatus.loading || networkStatus === NetworkStatus.refetch
}
