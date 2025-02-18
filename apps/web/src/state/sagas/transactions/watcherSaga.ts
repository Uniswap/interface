import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { createUniverseTransaction } from 'state/sagas/utils/transaction'
import { PendingTransactionDetails } from 'state/transactions/types'
import { call } from 'typed-redux-saga'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { refetchGQLQueries } from 'uniswap/src/features/portfolio/portfolioUpdates/refetchGQLQueriesSaga'

import { createSaga } from 'uniswap/src/utils/saga'

type WatchTransactionsCallbackParams = {
  pendingDiff: PendingTransactionDetails[]
  address: string
  chainId: UniverseChainId
  apolloClient: ApolloClient<NormalizedCacheObject>
}

type WatchTransactionsCallback = (params: WatchTransactionsCallbackParams) => void

function* watchTransactions(params: WatchTransactionsCallbackParams) {
  const { address, chainId, pendingDiff, apolloClient } = params

  const info = pendingDiff[0].info
  const transaction = createUniverseTransaction(info, chainId, address)

  if (!transaction) {
    return
  }

  yield call(refetchGQLQueries, { transaction, apolloClient, activeAddress: address })
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
