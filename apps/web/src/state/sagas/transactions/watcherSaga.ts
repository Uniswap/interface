import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { QueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { createUniverseTransaction } from 'state/sagas/utils/transaction'
import { PendingTransactionDetails } from 'state/transactions/types'
import { call } from 'typed-redux-saga'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { refetchQueries } from 'uniswap/src/features/portfolio/portfolioUpdates/refetchQueriesSaga'

import { createSaga } from 'uniswap/src/utils/saga'

type WatchTransactionsCallbackParams = {
  pendingDiff: PendingTransactionDetails[]
  address: string
  chainId: UniverseChainId
  apolloClient: ApolloClient<NormalizedCacheObject>
  queryClient: QueryClient
}

type WatchTransactionsCallback = (params: WatchTransactionsCallbackParams) => void

function* watchTransactions(params: WatchTransactionsCallbackParams) {
  const { address, chainId, pendingDiff, apolloClient } = params

  const info = pendingDiff[0].typeInfo
  const transaction = createUniverseTransaction({ info, chainId, address })

  yield call(refetchQueries, { transaction, apolloClient, activeAddress: address })
}

export const watchTransactionsSaga = createSaga(watchTransactions, 'watchTransactions')

export function useWatchTransactionsCallback(): WatchTransactionsCallback {
  const appDispatch = useDispatch()

  return useCallback(
    (params) => {
      appDispatch(watchTransactionsSaga.actions.trigger(params))
    },
    [appDispatch],
  )
}
