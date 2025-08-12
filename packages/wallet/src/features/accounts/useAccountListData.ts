import { NetworkStatus, WatchQueryFetchPolicy } from '@apollo/client'
import { useMemo } from 'react'
import {
  AccountListQuery,
  useAccountListQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GqlResult } from 'uniswap/src/data/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { usePortfolioValueModifiers } from 'uniswap/src/features/dataApi/balances/balances'

export function useAccountListData({
  addresses,
  fetchPolicy,
  notifyOnNetworkStatusChange,
}: {
  addresses: Address[]
  fetchPolicy?: WatchQueryFetchPolicy
  notifyOnNetworkStatusChange?: boolean | undefined
}): GqlResult<AccountListQuery> & {
  startPolling: (pollInterval: number) => void
  stopPolling: () => void
  networkStatus: NetworkStatus
  refetch: () => void
} {
  const { gqlChains } = useEnabledChains()

  const valueModifiers = usePortfolioValueModifiers(addresses)
  const { data, loading, networkStatus, refetch, startPolling, stopPolling } = useAccountListQuery({
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
