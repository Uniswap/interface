import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ProposalTypes, SessionTypes } from '@walletconnect/types'
import { ChainId } from 'wallet/src/constants/chains'
import {
  DappInfo,
  EthMethod,
  EthSignMethod,
  EthTransaction,
} from 'wallet/src/features/walletConnect/types'

export type WalletConnectPendingSession = {
  id: string
  chains: ChainId[]
  dapp: DappInfo
  proposalNamespaces: ProposalTypes.RequiredNamespaces
}

export type WalletConnectSession = {
  id: string
  chains: ChainId[]
  dapp: DappInfo
  namespaces: SessionTypes.Namespaces
}

interface SessionMapping {
  [sessionId: string]: WalletConnectSession
}

interface BaseRequest {
  sessionId: string
  internalId: string
  account: string
  dapp: DappInfo
  chainId: ChainId
}

export interface SignRequest extends BaseRequest {
  type: EthSignMethod
  message: string | null
  rawMessage: string
}

export interface TransactionRequest extends BaseRequest {
  type: EthMethod.EthSendTransaction
  transaction: EthTransaction
}

export type WalletConnectRequest = SignRequest | TransactionRequest

export const isTransactionRequest = (
  request: WalletConnectRequest
): request is TransactionRequest => request.type === EthMethod.EthSendTransaction

export interface WalletConnectState {
  byAccount: {
    [accountId: string]: {
      sessions: SessionMapping
    }
  }
  pendingSession: WalletConnectPendingSession | null
  pendingRequests: WalletConnectRequest[]
  didOpenFromDeepLink?: boolean
  hasPendingSessionError?: boolean
}

export const initialWalletConnectState: Readonly<WalletConnectState> = {
  byAccount: {},
  pendingSession: null,
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.byAccount[account]!.sessions[wcSession.id] = wcSession
      state.pendingSession = null
    },

    updateSession: (
      state,
      action: PayloadAction<{ account: string; wcSession: WalletConnectSession }>
    ) => {
      const { wcSession, account } = action.payload
      const wcAccount = state.byAccount[account]
      if (wcAccount) {
        wcAccount.sessions[wcSession.id] = wcSession
      }
    },

    removeSession: (state, action: PayloadAction<{ sessionId: string; account?: string }>) => {
      const { sessionId, account } = action.payload

      // If account address is known, delete directly
      if (account) {
        const wcAccount = state.byAccount[account]
        if (wcAccount) {
          delete wcAccount.sessions[sessionId]
        }
        return
      }

      // If account address is not known (handling `session_delete` events),
      // iterate over each account and delete the sessionId
      Object.keys(state.byAccount).forEach((accountAddress) => {
        const wcAccount = state.byAccount[accountAddress]
        if (wcAccount && wcAccount.sessions[sessionId]) {
          delete wcAccount.sessions[sessionId]
        }
      })
    },

    addPendingSession: (
      state,
      action: PayloadAction<{ wcSession: WalletConnectPendingSession }>
    ) => {
      const { wcSession } = action.payload
      state.pendingSession = wcSession
    },

    removePendingSession: (state) => {
      state.pendingSession = null
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

    setDidOpenFromDeepLink: (state, action: PayloadAction<boolean | undefined>) => {
      state.didOpenFromDeepLink = action.payload
    },

    setHasPendingSessionError: (state, action: PayloadAction<boolean | undefined>) => {
      state.hasPendingSessionError = action.payload
    },
  },
})

export const {
  addSession,
  updateSession,
  removeSession,
  addPendingSession,
  removePendingSession,
  addRequest,
  removeRequest,
  setDidOpenFromDeepLink,
  setHasPendingSessionError,
} = slice.actions
export const { reducer: walletConnectReducer } = slice
