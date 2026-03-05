import { TransactionTypeFilter } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { useMemo } from 'react'
import { LIMIT_SUPPORTED_CHAINS } from 'uniswap/src/features/chains/chainInfo'
import { useListTransactions } from 'uniswap/src/features/dataApi/listTransactions/listTransactions'
import { BaseResult } from 'uniswap/src/features/dataApi/types'
import { UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isLimitOrder, isUniswapXOrderPending } from 'uniswap/src/features/transactions/utils/uniswapX.utils'

/**
 * Custom hook that fetches open limit orders using the ListTransactions API
 * with server-side filtering by transaction type
 */
export function useOpenLimitOrders({
  evmAddress,
  svmAddress,
}: {
  evmAddress: string
  svmAddress?: string
}): BaseResult<UniswapXOrderDetails[]> {
  const {
    data: allLimitOrders,
    loading,
    isFetching,
    error,
    refetch,
    networkStatus,
  } = useListTransactions({
    evmAddress,
    svmAddress,
    chainIds: LIMIT_SUPPORTED_CHAINS,
    filterTransactionTypes: [TransactionTypeFilter.LIMIT_ORDER],
  })

  const openLimitOrders = useMemo(
    () =>
      allLimitOrders?.filter((tx): tx is UniswapXOrderDetails => isLimitOrder(tx) && isUniswapXOrderPending(tx)) ?? [],
    [allLimitOrders],
  )

  return {
    data: openLimitOrders,
    loading: loading || isFetching,
    error: error ?? undefined,
    networkStatus,
    refetch,
  }
}
