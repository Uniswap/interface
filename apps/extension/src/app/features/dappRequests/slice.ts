import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DappInfo } from 'src/app/features/dapp/store'
import {
  DappRequest,
  isConnectionRequest,
  isSendTransactionRequest,
  SendTransactionRequest,
} from 'src/app/features/dappRequests/types/DappRequestTypes'

export interface SenderTabInfo {
  id: number
  url: string
  favIconUrl?: string
}

interface DappRequestState {
  pending: DappRequestStoreItem[]
}

const initialDappRequestState: DappRequestState = {
  pending: [], // ordered array with the most recent request at the end
}

export interface DappRequestStoreItem {
  dappRequest: DappRequest
  senderTabInfo: SenderTabInfo
  dappInfo?: DappInfo
  isSidebarClosed: boolean | undefined
}

// Enforces that a request object in state is for an eth send txn request
export interface DappRequestStoreItemForEthSendTxn extends DappRequestStoreItem {
  dappRequest: SendTransactionRequest
}

export function isDappRequestStoreItemForEthSendTxn(
  request: DappRequestStoreItem,
): request is DappRequestStoreItemForEthSendTxn {
  return isSendTransactionRequest(request.dappRequest)
}

const slice = createSlice({
  name: 'dappRequests',
  initialState: initialDappRequestState,
  reducers: {
    add: (state, action: PayloadAction<DappRequestStoreItem>) => {
      if (isConnectionRequest(action.payload.dappRequest)) {
        // Remove existing connection requests from the same tab and of the same type
        state.pending = state.pending.filter(
          (request) =>
            request.senderTabInfo.id !== action.payload.senderTabInfo.id ||
            request.dappRequest.type !== action.payload.dappRequest.type,
        )
      }
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
