import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { DappInfo, EthMethod } from 'src/features/walletConnect/types'

export interface WalletConnectSession {
  id: string
  dapp: DappInfo
}

interface SessionMapping {
  [sessionId: string]: WalletConnectSession
}

interface BaseRequest {
  internalId: string
  account: string
  dapp: DappInfo
}

interface SignRequest extends BaseRequest {
  type: EthMethod.PersonalSign | EthMethod.SignTypedData
  message: string
}

export type WalletConnectRequest = SignRequest

export interface WalletConnectState {
  byAccount: {
    [accountId: string]: {
      sessions: SessionMapping
    }
  }

  pendingRequests: WalletConnectRequest[]
}

const initialWalletConnectState: Readonly<WalletConnectState> = {
  byAccount: {},
  pendingRequests: [],
}

const slice = createSlice({
  name: 'walletConnect',
  initialState: initialWalletConnectState,
  reducers: {
    addSession: (
      state,
      action: PayloadAction<{ account: string; wcSession: WalletConnectSession }>
    ) => {
      const { wcSession, account } = action.payload
      state.byAccount[account] ??= { sessions: {} }
      state.byAccount[account].sessions[wcSession.id] = wcSession
    },

    removeSession: (state, action: PayloadAction<{ account: string; sessionId: string }>) => {
      const { sessionId, account } = action.payload
      if (state.byAccount[account]) {
        delete state.byAccount[account].sessions[sessionId]
      }
    },

    addRequest: (
      state,
      action: PayloadAction<{ request: WalletConnectRequest; account: string }>
    ) => {
      const { request } = action.payload
      state.pendingRequests.push(request)
    },

    removeRequest: (
      state,
      action: PayloadAction<{ requestInternalId: string; account: string }>
    ) => {
      const { requestInternalId } = action.payload
      state.pendingRequests = state.pendingRequests.filter(
        (req) => req.internalId !== requestInternalId
      )
    },
  },
})

export const { addSession, removeSession, addRequest, removeRequest } = slice.actions
export const { reducer: walletConnectReducer, actions: walletConnectActions } = slice
