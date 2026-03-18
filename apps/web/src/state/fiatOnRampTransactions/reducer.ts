/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { createSlice } from '@reduxjs/toolkit'
import { FORTransaction } from 'uniswap/src/features/fiatOnRamp/types'
import { FiatOnRampTransactionStatus, FiatOnRampTransactionType } from '~/state/fiatOnRampTransactions/types'

export type FiatOnRampTransactionDetails = {
  account: string
  externalSessionId: string
  status: FiatOnRampTransactionStatus
  forceFetched: boolean
  addedAt: number
  type: FiatOnRampTransactionType
  syncedWithBackend: boolean
  provider: string
  original?: FORTransaction
}

export interface FiatOnRampTransactionsState {
  [account: string]: { [id: string]: FiatOnRampTransactionDetails }
}

export const initialState: FiatOnRampTransactionsState = {}

const fiatOnRampTransactionsSlice = createSlice({
  name: 'fiatOnRampTransactions',
  initialState,
  reducers: {
    addFiatOnRampTransaction(fiatOnRampTransactions, { payload }: { payload: FiatOnRampTransactionDetails }) {
      if (fiatOnRampTransactions[payload.account]?.[payload.externalSessionId]) {
        return
      }

      const accountTransactions = fiatOnRampTransactions[payload.account] ?? {}
      accountTransactions[payload.externalSessionId] = payload

      fiatOnRampTransactions[payload.account] = accountTransactions
    },
    updateFiatOnRampTransaction(fiatOnRampTransactions, { payload }: { payload: FiatOnRampTransactionDetails }) {
      if (!fiatOnRampTransactions[payload.account]?.[payload.externalSessionId]) {
        throw Error('Attempted to update non-existent FOR transaction.')
      }

      fiatOnRampTransactions[payload.account][payload.externalSessionId] = payload
    },
    removeFiatOnRampTransaction(fiatOnRampTransactions, { payload }: { payload: FiatOnRampTransactionDetails }) {
      if (fiatOnRampTransactions[payload.account][payload.externalSessionId]) {
        delete fiatOnRampTransactions[payload.account][payload.externalSessionId]
      }
    },
    resetFiatOnRamp: () => initialState,
  },
})

export const { addFiatOnRampTransaction, updateFiatOnRampTransaction, removeFiatOnRampTransaction, resetFiatOnRamp } =
  fiatOnRampTransactionsSlice.actions
export default fiatOnRampTransactionsSlice.reducer
