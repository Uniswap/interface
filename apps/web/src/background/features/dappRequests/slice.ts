import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { BaseDappRequest } from './dappRequestTypes'
export interface DappRequestState {
  pending: DappRequestStoreItem[]
}
export const initialDappRequestState: DappRequestState = {
  pending: [], // ordered array with the most recent request at the end
}

export interface DappRequestStoreItem {
  dappRequest: BaseDappRequest
  account: Account
  senderTabId: number
  dappUrl: string | undefined
}

const slice = createSlice({
  name: 'dappRequests',
  initialState: initialDappRequestState,
  reducers: {
    add: (state, action: PayloadAction<DappRequestStoreItem>) => {
      state.pending.push(action.payload)
    },
    remove: (state, action: PayloadAction<string>) => {
      const requestId = action.payload
      const newState = state.pending.filter((tx) => tx.dappRequest.requestId !== requestId)
      state.pending = newState
    },
  },
})

export const dappRequestActions = slice.actions
export const dappRequestReducer = slice.reducer
