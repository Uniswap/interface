import { useApolloClient } from '@apollo/client'
import { SharedQueryClient } from '@universe/api'
import { useCallback, useState } from 'react'
import { NFTS_TAB_DATA_DEPENDENCIES } from 'uniswap/src/components/nfts/constants'
import { getPortfolioQuery } from 'uniswap/src/data/rest/getPortfolio'
import { getListTransactionsQuery } from 'uniswap/src/data/rest/listTransactions'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

interface HomeScreenPortfolioRefreshState {
  refreshing: boolean
  onRefresh: () => Promise<void | (() => void)>
}

export function useHomeScreenPortfolioRefresh({
  shouldLoadNfts,
}: {
  shouldLoadNfts: boolean
}): HomeScreenPortfolioRefreshState {
  const apolloClient = useApolloClient()
  const activeAccount = useActiveAccountWithThrow()
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)

    const activeAccountAddress = activeAccount.address

    const restQueriesToInvalidate = [
      SharedQueryClient.invalidateQueries({
        queryKey: getPortfolioQuery({ input: { evmAddress: activeAccountAddress } }).queryKey,
      }),
      SharedQueryClient.invalidateQueries({
        queryKey: getListTransactionsQuery({ input: { evmAddress: activeAccountAddress } }).queryKey,
      }),
    ]
    const gqlQueriesToRefetch = shouldLoadNfts ? [...NFTS_TAB_DATA_DEPENDENCIES] : []

    await Promise.all([
      ...restQueriesToInvalidate,
      gqlQueriesToRefetch.length > 0
        ? apolloClient.refetchQueries({
            include: gqlQueriesToRefetch,
          })
        : Promise.resolve(),
    ])

    const timeout = setTimeout(() => setRefreshing(false), 500)
    return () => clearTimeout(timeout)
  }, [apolloClient, activeAccount.address, shouldLoadNfts])

  return { refreshing, onRefresh }
}
