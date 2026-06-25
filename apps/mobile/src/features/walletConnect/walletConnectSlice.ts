import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { TradingApi } from '@universe/api'
import { type ProposalTypes, type SessionTypes } from '@walletconnect/types'
import { type UniverseChainId } from 'uniswap/src/features/chains/types'
import { EthMethod, type EthSignMethod } from 'uniswap/src/features/dappRequests/types'
import { type DappRequestInfo, type EthTransaction, UwULinkMethod } from 'uniswap/src/types/walletConnect'
import { logger } from 'utilities/src/logger/logger'
import type { RpcUserOperation } from 'viem/account-abstraction'
import { type Call, type Capability, type DappVerificationStatus } from 'wallet/src/features/dappRequests/types'

export type WalletConnectPendingSession = {
  id: string
  chains: UniverseChainId[]
  dappRequestInfo: DappRequestInfo
  proposalNamespaces: ProposalTypes.OptionalNamespaces
  verifyStatus: DappVerificationStatus
  /**
   * The origin URL as reported by WalletConnect Verify (`verifyContext.verified.origin`).
   * Only set when WC Verify supplied a trusted origin — never sourced from dapp-provided
   * metadata. Use this (not `dappRequestInfo.url`) when making trust decisions such as the
   * first-party allowlist override.
   */
  trustedOriginUrl?: string
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

export interface WalletSendCallsUserOperationRequest extends WalletSendCallsRequest {
  unsignedUserOperation: RpcUserOperation<'0.8'>
  requestId: string
  gasSponsored: boolean
  sponsorMetadata?: TradingApi.SponsorMetadata
  paymasterServiceUrl: string
  paymasterServiceContext?: Record<string, unknown>
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
  | WalletSendCallsUserOperationRequest

type PersonalSignRequest = SignRequest & {
  type: EthMethod.PersonalSign | EthMethod.EthSign
}

export const isTransactionRequest = (request: WalletConnectSigningRequest): request is TransactionRequest =>
  request.type === EthMethod.EthSendTransaction || request.type === UwULinkMethod.Erc20Send

export const isPersonalSignRequest = (request: WalletConnectSigningRequest): request is PersonalSignRequest =>
  request.type === EthMethod.PersonalSign || request.type === EthMethod.EthSign

export const isBatchedTransactionRequest = (
  request: WalletConnectSigningRequest,
): request is WalletSendCallsEncodedRequest =>
  request.type === EthMethod.WalletSendCalls && 'encodedTransaction' in request

export const isUserOpRequest = (request: WalletConnectSigningRequest): request is WalletSendCallsUserOperationRequest =>
  request.type === EthMethod.WalletSendCalls && 'unsignedUserOperation' in request

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
    resetWalletConnect: () => initialWalletConnectState,
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
  resetWalletConnect,
} = slice.actions
export const { reducer: walletConnectReducer } = slice
