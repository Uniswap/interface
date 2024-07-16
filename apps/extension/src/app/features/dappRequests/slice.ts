import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DappInfo } from 'src/app/features/dapp/store'
import { DappRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'

export interface SenderTabInfo {
  id: number
  url: string
  favIconUrl?: string
}

export interface DappRequestState {
  pending: DappRequestStoreItem[]
}
export const initialDappRequestState: DappRequestState = {
  pending: [], // ordered array with the most recent request at the end
}

export interface DappRequestStoreItem {
  dappRequest: DappRequest
  senderTabInfo: SenderTabInfo
  dappInfo?: DappInfo
  isSidebarClosed: boolean | undefined
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
    removeAll: (state) => {
      state.pending = []
    },
  },
})

export const dappRequestActions = slice.actions
export const dappRequestReducer = slice.reducer
