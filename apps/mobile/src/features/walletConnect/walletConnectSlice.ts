import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ProposalTypes, SessionTypes } from '@walletconnect/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EthMethod, EthSignMethod } from 'uniswap/src/features/dappRequests/types'
import { DappRequestInfo, EthTransaction, UwULinkMethod } from 'uniswap/src/types/walletConnect'
import { logger } from 'utilities/src/logger/logger'
import { Call, Capability, DappVerificationStatus } from 'wallet/src/features/dappRequests/types'

export type WalletConnectPendingSession = {
  id: string
  chains: UniverseChainId[]
  dappRequestInfo: DappRequestInfo
  proposalNamespaces: ProposalTypes.OptionalNamespaces
  verifyStatus: DappVerificationStatus
}

export type WalletConnectSession = {
  id: string
  chains: UniverseChainId[]
  dappRequestInfo: DappRequestInfo
  namespaces: SessionTypes.Namespaces

  /**
   * WC session namespaces can contain approvals for multiple accounts. The active account represents the account that the dapp
   * is tracking as the active account based on session events (approve session, change account, etc).
   */
  activeAccount: string

  /**
   * EIP-5792 capabilities for this session, stored in hex chainId format.
   * Contains atomic batch support status per chain.
   * Only populated if EIP-5792 feature flag was enabled during session approval.
   */
  capabilities?: Record<string, Capability>
}

interface BaseRequest {
  sessionId: string
  internalId: string
  account: string
  dappRequestInfo: DappRequestInfo
  chainId: UniverseChainId
  isLinkModeSupported?: boolean
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

export interface WalletGetCapabilitiesRequest extends Omit<BaseRequest, 'chainId'> {
  type: EthMethod.WalletGetCapabilities
  account: Address // Wallet address
  chainIds?: UniverseChainId[] // Optional array of chain IDs
}

export interface WalletSendCallsRequest extends BaseRequest {
  calls: Call[]
  capabilities: Record<string, Capability>
  id: string
  type: EthMethod.WalletSendCalls
  version: string
}

export interface WalletSendCallsEncodedRequest extends WalletSendCallsRequest {
  encodedTransaction: EthTransaction
  encodedRequestId: string
}

export interface WalletGetCallsStatusRequest extends BaseRequest {
  id: string
  type: EthMethod.WalletGetCallsStatus
}

export interface UwuLinkErc20Request extends BaseRequest {
  type: UwULinkMethod.Erc20Send
  recipient: {
    address: string
    name: string
    logo?: {
      dark?: string
      light?: string
    }
  }
  tokenAddress: string
  amount: string
  isStablecoin: boolean
  transaction: EthTransaction // the formatted transaction, prepared by the wallet
}

export type WalletConnectSigningRequest =
  | SignRequest
  | TransactionRequest
  | UwuLinkErc20Request
  | WalletSendCallsEncodedRequest

type PersonalSignRequest = SignRequest & {
  type: EthMethod.PersonalSign | EthMethod.EthSign
}

export const isTransactionRequest = (request: WalletConnectSigningRequest): request is TransactionRequest =>
  request.type === EthMethod.EthSendTransaction || request.type === UwULinkMethod.Erc20Send

export const isPersonalSignRequest = (request: WalletConnectSigningRequest): request is PersonalSignRequest =>
  request.type === EthMethod.PersonalSign || request.type === EthMethod.EthSign

export const isBatchedTransactionRequest = (
  request: WalletConnectSigningRequest,
): request is WalletSendCallsEncodedRequest => request.type === EthMethod.WalletSendCalls

export interface WalletConnectState {
  sessions: {
    [sessionId: string]: WalletConnectSession
  }
  pendingSession: WalletConnectPendingSession | null
  pendingRequests: WalletConnectSigningRequest[]
  didOpenFromDeepLink?: boolean
  hasPendingSessionError?: boolean
}

export const initialWalletConnectState: Readonly<WalletConnectState> = {
  sessions: {},
  pendingSession: null,
  pendingRequests: [],
}

const slice = createSlice({
  name: 'walletConnect',
  initialState: initialWalletConnectState,
  reducers: {
    addSession: (state, action: PayloadAction<{ wcSession: WalletConnectSession }>) => {
      const { wcSession } = action.payload
      state.sessions[wcSession.id] = wcSession
      state.pendingSession = null
    },

    replaceSession: (state, action: PayloadAction<{ wcSession: WalletConnectSession }>) => {
      const { wcSession } = action.payload
      state.sessions[wcSession.id] = wcSession
    },

    removeSession: (state, action: PayloadAction<{ sessionId: string }>) => {
      const { sessionId } = action.payload

      if (!state.sessions[sessionId]) {
        logger.warn('walletConnect/walletConnectSlice.ts', 'removeSession', `Session ${sessionId} doesnt exist`)
      }

      delete state.sessions[sessionId]
    },

    addPendingSession: (state, action: PayloadAction<{ wcSession: WalletConnectPendingSession }>) => {
      const { wcSession } = action.payload
      state.pendingSession = wcSession
    },

    removePendingSession: (state) => {
      state.pendingSession = null
    },

    addRequest: (state, action: PayloadAction<WalletConnectSigningRequest>) => {
      state.pendingRequests.push(action.payload)
    },

    removeRequest: (state, action: PayloadAction<{ requestInternalId: string; account: string }>) => {
      const { requestInternalId } = action.payload
      state.pendingRequests = state.pendingRequests.filter((req) => req.internalId !== requestInternalId)
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
  replaceSession,
  removeSession,
  addPendingSession,
  removePendingSession,
  addRequest,
  removeRequest,
  setDidOpenFromDeepLink,
  setHasPendingSessionError,
} = slice.actions
export const { reducer: walletConnectReducer } = slice
