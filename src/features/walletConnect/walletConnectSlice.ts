import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { WalletConnectModalState } from 'src/components/WalletConnect/ScanSheet/WalletConnectModal'
import {
  DappInfo,
  EthSignMethod,
  EthTransaction,
  EthTransactionMethod,
} from 'src/features/walletConnect/types'

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
  type: EthSignMethod
  message: string
}

interface TransactionRequest extends BaseRequest {
  type: EthTransactionMethod
  transaction: EthTransaction
}

export type WalletConnectRequest = SignRequest | TransactionRequest

export interface WalletConnectState {
  byAccount: {
    [accountId: string]: {
      sessions: SessionMapping
    }
  }

  pendingRequests: WalletConnectRequest[]
  modalState: WalletConnectModalState
}

const initialWalletConnectState: Readonly<WalletConnectState> = {
  byAccount: {},
  pendingRequests: [],
  modalState: WalletConnectModalState.Hidden,
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

    updateSession: (
      state,
      action: PayloadAction<{ account: string; wcSession: WalletConnectSession }>
    ) => {
      const { wcSession, account } = action.payload
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

    setWalletConnectModalState: (
      state,
      action: PayloadAction<{ modalState: WalletConnectModalState }>
    ) => {
      const { modalState } = action.payload
      state.modalState = modalState
    },
  },
})

export const {
  addSession,
  updateSession,
  removeSession,
  addRequest,
  removeRequest,
  setWalletConnectModalState,
} = slice.actions
export const { reducer: walletConnectReducer, actions: walletConnectActions } = slice
