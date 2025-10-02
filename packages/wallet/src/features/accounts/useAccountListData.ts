import { NetworkStatus, WatchQueryFetchPolicy } from '@apollo/client'
import { GqlResult, GraphQLApi } from '@universe/api'
import { useMemo } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
// biome-ignore lint/style/noRestrictedImports: This is the wrapper hook that uses the restricted hook properly
import { usePortfolioValueModifiers } from 'uniswap/src/features/dataApi/balances/balances'

export function useAccountListData({
  addresses,
  fetchPolicy,
  notifyOnNetworkStatusChange,
}: {
  addresses: Address[]
  fetchPolicy?: WatchQueryFetchPolicy
  notifyOnNetworkStatusChange?: boolean | undefined
}): GqlResult<GraphQLApi.AccountListQuery> & {
  startPolling: (pollInterval: number) => void
  stopPolling: () => void
  networkStatus: NetworkStatus
  refetch: () => void
} {
  const { gqlChains } = useEnabledChains()

  const valueModifiers = usePortfolioValueModifiers(addresses)
  const { data, loading, networkStatus, refetch, startPolling, stopPolling } = GraphQLApi.useAccountListQuery({
    variables: { addresses, valueModifiers, chains: gqlChains },
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

export function useAccountBalances({
  addresses,
  fetchPolicy,
}: {
  addresses: Address[]
  fetchPolicy?: WatchQueryFetchPolicy
}): {
  balances: number[]
  totalBalance: number
} {
  const { data } = useAccountListData({
    addresses,
    fetchPolicy,
  })

  const balances = useMemo(() => {
    const valuesUnfiltered = data?.portfolios
      ?.map((p) => p?.tokensTotalDenominatedValue?.value)
      .filter((v) => v !== undefined)

    if (valuesUnfiltered === undefined) {
      return []
    }

    return valuesUnfiltered as number[]
  }, [data?.portfolios])

  return {
    balances,
    totalBalance: balances.reduce((a, b) => a + b, 0),
  }
}
