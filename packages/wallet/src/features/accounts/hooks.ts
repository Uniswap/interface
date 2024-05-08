import { NetworkStatus, WatchQueryFetchPolicy } from '@apollo/client'
import {
  AccountListQuery,
  // eslint-disable-next-line no-restricted-imports
  useAccountListQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GqlResult } from 'uniswap/src/data/types'
// eslint-disable-next-line no-restricted-imports
import { usePortfolioValueModifiers } from 'wallet/src/features/dataApi/balances'

export function useAccountList({
  addresses,
  fetchPolicy,
  notifyOnNetworkStatusChange,
}: {
  addresses: Address | Address[]
  fetchPolicy?: WatchQueryFetchPolicy
  notifyOnNetworkStatusChange?: boolean | undefined
}): GqlResult<AccountListQuery> & {
  startPolling: (pollInterval: number) => void
  stopPolling: () => void
  networkStatus: NetworkStatus
  refetch: () => void
} {
  const valueModifiers = usePortfolioValueModifiers(addresses)
  const { data, loading, networkStatus, refetch, startPolling, stopPolling } = useAccountListQuery({
    variables: { addresses, valueModifiers },
    notifyOnNetworkStatusChange,
    fetchPolicy,
  })

  return {
    data,
    loading,
    networkStatus,
    refetch,
    startPolling,
    stopPolling,
  }
}
