import { createSelector } from '@reduxjs/toolkit'
import { RootState } from 'src/app/rootReducer'
import { ChainId } from 'src/constants/chains'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { flattenObjectOfObjects } from 'src/utils/objects'

export const selectTransactions = (state: RootState) => state.transactions.byChainId
export const selectTransaction = (chainId: ChainId, id: string) =>
  createSelector(selectTransactions, (txsByChainId) => txsByChainId[chainId]?.[id])

/** Returns a list of past recipients by chain id ordered from lastest to oldest */
export const selectRecentRecipients = createSelector(selectTransactions, (txsByChainId) =>
  flattenObjectOfObjects(txsByChainId)
    .filter(
      (txDetails: TransactionDetails) =>
        txDetails.typeInfo.type === TransactionType.Send &&
        txDetails.options.request.to !== undefined
    )
    .sort((a, b) => (a.addedTime < b.addedTime ? 1 : -1))
    .map((txDetails) => txDetails.options.request.to ?? '')
    .slice(0, 15)
)

export const selectlastTxHistoryUpdate = (state: RootState) =>
  state.transactions.lastTxHistoryUpdate

export const selectPendingTransactions = createSelector(selectTransactions, (txsByChainId) =>
  flattenObjectOfObjects(txsByChainId).filter(
    (txDetails) => txDetails.status === TransactionStatus.Pending
  )
)
