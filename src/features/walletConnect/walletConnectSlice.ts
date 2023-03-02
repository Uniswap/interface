import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ProposalTypes } from '@walletconnect/types'
import { ChainId } from 'src/constants/chains'
import {
  DappInfo,
  DappInfoV1,
  DappInfoV2,
  EthMethod,
  EthSignMethod,
  EthTransaction,
  EthTransactionMethod,
} from 'src/features/walletConnect/types'

export type WalletConnectSessionV1 = {
  id: string
  dapp: DappInfoV1
  version: '1'
}

export type WalletConnectSessionV2 = {
  id: string
  chains: ChainId[]
  dapp: DappInfoV2
  proposalNamespaces: ProposalTypes.RequiredNamespaces
  version: '2'
}

export type WalletConnectSession = WalletConnectSessionV1 | WalletConnectSessionV2

interface SessionMapping {
  [sessionId: string]: WalletConnectSession
}

interface BaseRequest {
  sessionId: string
  internalId: string
  account: string
  dapp: DappInfo
  chainId: ChainId
  version: '1' | '2'
}

export interface SignRequest extends BaseRequest {
  type: EthSignMethod
  message: string | null
  rawMessage: string
}

export interface TransactionRequest extends BaseRequest {
  type: EthTransactionMethod
  transaction: EthTransaction
}

export interface SwitchChainRequest extends BaseRequest {
  type: EthMethod.SwitchChain | EthMethod.AddChain
  newChainId: number
  dapp: DappInfoV1
  version: '1'
}

export type WalletConnectRequest = SignRequest | TransactionRequest | SwitchChainRequest

export const isTransactionRequest = (
  request: WalletConnectRequest
): request is TransactionRequest =>
  request.type === EthMethod.EthSendTransaction || request.type === EthMethod.EthSignTransaction

export interface WalletConnectState {
  byAccount: {
    [accountId: string]: {
      sessions: SessionMapping
    }
  }
  pendingSession: WalletConnectSession | null
  pendingRequests: WalletConnectRequest[]
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

    removeSession: (state, action: PayloadAction<{ account: string; sessionId: string }>) => {
      const { sessionId, account } = action.payload
      const wcAccount = state.byAccount[account]
      if (wcAccount) {
        delete wcAccount.sessions[sessionId]
      }
    },

    addPendingSession: (state, action: PayloadAction<{ wcSession: WalletConnectSession }>) => {
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
} = slice.actions
export const { reducer: walletConnectReducer } = slice
