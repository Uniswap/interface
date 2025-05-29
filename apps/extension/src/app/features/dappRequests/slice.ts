import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { confirmRequest, confirmRequestNoDappInfo } from 'src/app/features/dappRequests/actions'
import type { DappRequestStoreItem } from 'src/app/features/dappRequests/shared'
import { DappRequestStatus } from 'src/app/features/dappRequests/shared'
import {
  isConnectionRequest,
  isSendCallsRequest,
  isSendTransactionRequest,
  type SendCallsRequest,
  type SendTransactionRequest,
} from 'src/app/features/dappRequests/types/DappRequestTypes'

type RequestId = string
type WithMetadata<T> = T & {
  createdAt: number
  status: DappRequestStatus
}
export interface DappRequestState {
  requests: Record<RequestId, WithMetadata<DappRequestStoreItem>>
  mostRecent5792DappUrl: string | null
}

const initialDappRequestState: DappRequestState = {
  requests: {}, // record of requestId -> request
  mostRecent5792DappUrl: null,
}

// Enforces that a request object in state is for an eth send txn request
export interface DappRequestStoreItemForEthSendTxn extends DappRequestStoreItem {
  dappRequest: WithMetadata<SendTransactionRequest>
}

export function isDappRequestStoreItemForEthSendTxn(
  request: DappRequestStoreItem,
): request is DappRequestStoreItemForEthSendTxn {
  return isSendTransactionRequest(request.dappRequest)
}

export interface DappRequestStoreItemForSendCallsTxn extends DappRequestStoreItem {
  dappRequest: SendCallsRequest
}

export function isDappRequestStoreItemForSendCallsTxn(
  request: DappRequestStoreItem,
): request is DappRequestStoreItemForSendCallsTxn {
  return isSendCallsRequest(request.dappRequest)
}

const selectDappRequestsArray = (state: DappRequestState) =>
  // sort by createdAt ascending (oldest first) to preserve order of requests
  Object.values(state.requests).sort((a, b) => a.createdAt - b.createdAt)

const slice = createSlice({
  name: 'dappRequests',
  initialState: initialDappRequestState,
  reducers: {
    add: (state, action: PayloadAction<DappRequestStoreItem>) => {
      if (isConnectionRequest(action.payload.dappRequest)) {
        const requests = selectDappRequestsArray(state)
        for (const request of requests) {
          // Remove existing connection requests from the same tab and of the same type
          if (
            request.senderTabInfo.id === action.payload.senderTabInfo.id &&
            request.dappRequest.type === action.payload.dappRequest.type
          ) {
            delete state.requests[request.dappRequest.requestId]
          }
        }
      }
      state.requests[action.payload.dappRequest.requestId] = {
        ...action.payload,
        // set the status to pending state
        status: DappRequestStatus.Pending,
        // set the createdAt time so we can sort by time
        createdAt: Date.now(),
      }
    },
    remove: (state, action: PayloadAction<string>) => {
      const requestId = action.payload
      delete state.requests[requestId]
    },
    removeAll: (state) => {
      state.requests = {}
    },
    setMostRecent5792DappUrl: (state, action: PayloadAction<string | null>) => {
      state.mostRecent5792DappUrl = action.payload
    },
  },
  extraReducers: (builder) => {
    // update status of request to confirming
    // on confirmRequest and confirmRequestNoDappInfo
    builder.addMatcher(
      (action) => action.type === confirmRequest.type || action.type === confirmRequestNoDappInfo.type,
      (state, action) => {
        const { dappRequest } = action.payload
        const request = state.requests[dappRequest.requestId]
        if (request) {
          request.status = DappRequestStatus.Confirming
        }
      },
    )
  },
})

export const selectAllDappRequests = (state: { dappRequests: DappRequestState }): DappRequestStoreItem[] =>
  selectDappRequestsArray(state.dappRequests)

export const selectIsRequestConfirming = (state: { dappRequests: DappRequestState }, requestId: string): boolean =>
  state.dappRequests.requests[requestId]?.status === DappRequestStatus.Confirming

export const selectMostRecent5792DappUrl = (state: { dappRequests: DappRequestState }): string | null =>
  state.dappRequests.mostRecent5792DappUrl

export const dappRequestActions = slice.actions
export const dappRequestReducer = slice.reducer
