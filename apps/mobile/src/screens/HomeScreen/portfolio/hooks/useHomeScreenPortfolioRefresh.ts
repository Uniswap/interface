import { SharedQueryClient } from '@universe/api'
import { useCallback, useState } from 'react'
import { getListTransactionsQuery } from 'uniswap/src/data/apiClients/dataApiService/activity/listTransactions'
import { getPortfolioQuery } from 'uniswap/src/data/apiClients/dataApiService/balances/getPortfolio'
import { getWalletBalancesQuery } from 'uniswap/src/data/apiClients/dataApiService/balances/getWalletBalances/getWalletBalances'
import { NFT_QUERY_KEY_PREFIX } from 'uniswap/src/data/apiClients/dataApiService/nfts/queries'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
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
        queryKey: getWalletBalancesQuery({ input: { evmAddress: activeAccountAddress } }).queryKey,
      }),
      SharedQueryClient.invalidateQueries({
        queryKey: getListTransactionsQuery({ input: { evmAddress: activeAccountAddress } }).queryKey,
      }),
      SharedQueryClient.invalidateQueries({ queryKey: [ReactQueryCacheKey.ListPositions] }),
    ]

    if (shouldLoadNfts) {
      restQueriesToInvalidate.push(SharedQueryClient.invalidateQueries({ queryKey: NFT_QUERY_KEY_PREFIX }))
    }

    await Promise.all(restQueriesToInvalidate)

    const timeout = setTimeout(() => setRefreshing(false), 500)
    return () => clearTimeout(timeout)
  }, [activeAccount.address, shouldLoadNfts])

  return { refreshing, onRefresh }
}
