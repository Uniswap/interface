import { Protocol } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { providers } from 'ethers/lib/ethers'
import { TransactionListQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { Routing, TransactionFailureReason } from 'uniswap/src/data/tradingApi/__generated__/index'
import { GasEstimate } from 'uniswap/src/data/tradingApi/types'
import { AssetType } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DappInfo } from 'uniswap/src/types/walletConnect'

export type ChainIdToTxIdToDetails = Partial<Record<UniverseChainId, { [txId: string]: TransactionDetails }>>

// Basic identifying info for a transaction
export interface TransactionId {
  chainId: UniverseChainId
  // For FOR transactions, this is the externalSessionId
  id: string
}

export type TransactionListQueryResponse = NonNullable<
  NonNullable<NonNullable<TransactionListQuery['portfolios']>[0]>['assetActivities']
>[0]

/**
 * Marks if a transaction was initiated natively within app, or from external source.
 * External transactions are initiated from dapps, WC, uwulink, etc.
 */
export enum TransactionOriginType  {
  Internal = 'internal',
  External = 'external',
}
interface BaseTransactionDetails extends TransactionId {
  ownerAddress?: Address
  from: Address

  transactionOriginType: TransactionOriginType

  // Specific info for the tx type
  typeInfo: TransactionTypeInfo

  // Info for status tracking
  status: TransactionStatus
  addedTime: number
  // Note: hash is mandatory for classic transactions and undefined for unfilled UniswapX orders
  // It may also become optional for classic if we start tracking txs before they're actually sent
  hash?: string

  // TODO(MOB-3679): receipt does not need to be persisted; remove from state
  receipt?: TransactionReceipt

  // cancelRequest is the txRequest object to be submitted
  // in attempt to cancel the current transaction
  // it should contain all the appropriate gas details in order
  // to be mined first
  // TODO(MOB-3679): cancelRequest does not need to be persisted; remove from state
  cancelRequest?: providers.TransactionRequest

  networkFee?: TransactionNetworkFee
}

export type TransactionNetworkFee = {
  quantity: string
  tokenSymbol: string
  tokenAddress: string
  chainId: UniverseChainId
}

export type GasFeeEstimates = {
  activeEstimate: GasEstimate
  shadowEstimates?: GasEstimate[]
}

export interface UniswapXOrderDetails extends BaseTransactionDetails {
  routing: Routing.DUTCH_V3 | Routing.DUTCH_V2 | Routing.DUTCH_LIMIT | Routing.PRIORITY

  // Note: `orderHash` is an off-chain value used to track orders before they're filled on-chain.
  // UniswapX orders will also have a transaction `hash` if they become filled.
  // `orderHash` will be an undefined if the object is built from a filled order received from graphql. Once filled, it is not needed for any tracking.
  orderHash?: string

  // Used to track status of the order before it is submitted
  queueStatus?: QueuedOrderStatus
}

export interface ClassicTransactionDetails extends BaseTransactionDetails {
  routing: Routing.CLASSIC

  // Info for submitting the tx
  options: TransactionOptions
}

export interface BridgeTransactionDetails extends BaseTransactionDetails {
  routing: Routing.BRIDGE

  // Info for submitting the tx
  options: TransactionOptions

  sendConfirmed?: boolean
}

export type OnChainTransactionDetails = ClassicTransactionDetails | BridgeTransactionDetails
export type TransactionDetails = UniswapXOrderDetails | OnChainTransactionDetails

export enum TransactionStatus {
  Canceled = 'cancelled',
  Cancelling = 'cancelling',
  FailedCancel = 'failedCancel',
  Success = 'confirmed',
  Failed = 'failed',
  Pending = 'pending',
  Replacing = 'replacing',
  Expired = 'expired',
  InsufficientFunds = 'insufficientFunds',
  Unknown = 'unknown',
  // May want more granular options here later like InMemPool
}

export enum QueuedOrderStatus {
  Waiting = 'waiting',
  ApprovalFailed = 'approvalFailed',
  WrapFailed = 'wrapFailed',
  AppClosed = 'appClosed',
  Stale = 'stale',
  SubmissionFailed = 'submissionFailed',
  Submitted = 'submitted',
}

export const TEMPORARY_TRANSACTION_STATUSES = [
  TransactionStatus.Pending,
  TransactionStatus.Replacing,
  TransactionStatus.Cancelling,
]

const FINAL_STATUSES = [
  TransactionStatus.Success,
  TransactionStatus.Failed,
  TransactionStatus.Canceled,
  TransactionStatus.FailedCancel,
  TransactionStatus.Expired,
] as const
export type FinalizedTransactionStatus = (typeof FINAL_STATUSES)[number]

export type FinalizedTransactionDetails = TransactionDetails &
  (
    | {
        status: TransactionStatus.Success
        hash: string
      }
    | {
        status: Exclude<FinalizedTransactionStatus, TransactionStatus.Success>
        hash?: string // Hash may be undefined for non-successful transactions, as the uniswapx backend does not provide hashes for cancelled, failed, or expired orders.
      }
  )

export type TransactionOptions = {
  request: providers.TransactionRequest
  userSubmissionTimestampMs?: number
  rpcSubmissionTimestampMs?: number
  rpcSubmissionDelayMs?: number
  currentBlockFetchDelayMs?: number
  timeoutTimestampMs?: number
  blockSubmitted?: number
  timeoutLogged?: boolean
  submitViaPrivateRpc?: boolean
  privateRpcProvider?: 'flashbots' | 'mevblocker'
}

export interface TransactionReceipt {
  transactionIndex: number
  blockHash: string
  blockNumber: number
  confirmedTime: number
  confirmations: number
  gasUsed: number
  effectiveGasPrice: number
}

export interface NFTSummaryInfo {
  tokenId: string
  name: string
  collectionName: string
  imageURL: string
  address: string
}

export enum NFTTradeType {
  BUY = 'buy',
  SELL = 'sell',
}

/**
 * Be careful adding to this enum, always assign a unique value (typescript will not prevent duplicate values).
 * These values are persisted in state and if you change the value it will cause errors
 */
export enum TransactionType {
  // Token Specific
  Approve = 'approve',
  Bridge = 'bridge',
  Swap = 'swap',
  Wrap = 'wrap',

  // NFT specific
  NFTApprove = 'nft-approve',
  NFTTrade = 'nft-trade',
  NFTMint = 'nft-mint',

  // All asset types
  Send = 'send',
  Receive = 'receive',

  // Fiat onramp
  FiatPurchaseDeprecated = 'fiat-purchase', // Deprecated, still here for use in migrations.
  LocalOnRamp = 'local-onramp',
  LocalOffRamp = 'local-offramp',
  OnRampPurchase = 'onramp-purchase',
  OnRampTransfer = 'onramp-transfer',
  OffRampSale = 'offramp-sale',

  // General
  WCConfirm = 'wc-confirm',
  Unknown = 'unknown',
}

export interface BaseTransactionInfo {
  type: TransactionType
  transactedUSDValue?: number
  isSpam?: boolean
  externalDappInfo?: DappInfo
  gasEstimates?: GasFeeEstimates
}

export interface ApproveTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.Approve
  tokenAddress: string
  spender: string
  approvalAmount?: string
  dappInfo?: DappInfoTransactionDetails
  // The id of the swap TransactionDetails object submitted after this approval on the current client, if applicable.
  swapTxId?: string
}

export interface BaseSwapTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.Swap
  tradeType?: TradeType
  inputCurrencyId: string
  outputCurrencyId: string
  slippageTolerance?: number
  quoteId?: string
  routeString?: string
  gasUseEstimate?: string
  protocol?: Protocol
  simulationFailureReasons?: TransactionFailureReason[]
}

export interface BridgeTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.Bridge
  inputCurrencyId: string
  inputCurrencyAmountRaw: string
  outputCurrencyId: string
  outputCurrencyAmountRaw: string
  quoteId?: string
  gasUseEstimate?: string
  routingDappInfo?: DappInfoTransactionDetails
}

export interface ExactInputSwapTransactionInfo extends BaseSwapTransactionInfo {
  tradeType: TradeType.EXACT_INPUT
  inputCurrencyAmountRaw: string
  expectedOutputCurrencyAmountRaw: string
  minimumOutputCurrencyAmountRaw: string
}

export interface ExactOutputSwapTransactionInfo extends BaseSwapTransactionInfo {
  tradeType: TradeType.EXACT_OUTPUT
  outputCurrencyAmountRaw: string
  expectedInputCurrencyAmountRaw: string
  maximumInputCurrencyAmountRaw: string
}

export interface ConfirmedSwapTransactionInfo extends BaseSwapTransactionInfo {
  inputCurrencyAmountRaw: string
  outputCurrencyAmountRaw: string
}

export interface WrapTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.Wrap
  unwrapped: boolean
  currencyAmountRaw: string
  // The id of the swap TransactionDetails object submitted after this wrap on the current client, if applicable.
  // Currently, this will only be set for wraps that are part of a UniswapX native-input swap.
  swapTxId?: string
}

export interface SendTokenTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.Send
  assetType: AssetType
  recipient: string
  tokenAddress: string
  currencyAmountRaw?: string
  tokenId?: string // optional. NFT token id
  nftSummaryInfo?: NFTSummaryInfo // optional. NFT metadata
  currencyAmountUSD?: Maybe<CurrencyAmount<Currency>> // optional, for analytics
}

export interface ReceiveTokenTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.Receive
  assetType: AssetType
  currencyAmountRaw?: string
  sender: string
  tokenAddress: string
  tokenId?: string // optional. NFT token id
  nftSummaryInfo?: NFTSummaryInfo
}

// Type stored locally for on-ramp transactions that were not found in the backend yet
export interface LocalOnRampTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.LocalOnRamp
}

export interface LocalOffRampTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.LocalOffRamp
}

export interface OnRampTransactionInfo extends BaseTransactionInfo {
  type: TransactionType
  id: string
  providerTransactionId?: string // surfaced to the user in the transaction details modal if they need to contact support
  destinationTokenSymbol: string
  destinationTokenAddress: string
  destinationTokenAmount?: number
  serviceProvider: ServiceProviderInfo
  // Fees are in units of the sourceCurrency for purchases,
  // and in units of the destinationToken for transfers
  networkFee?: number
  transactionFee?: number
  totalFee?: number
}

export interface OnRampPurchaseInfo extends OnRampTransactionInfo {
  type: TransactionType.OnRampPurchase
  sourceCurrency: string
  sourceAmount?: number
}

export interface OnRampTransferInfo extends OnRampTransactionInfo {
  type: TransactionType.OnRampTransfer
}

export interface OffRampSaleInfo extends OnRampTransactionInfo {
  type: TransactionType.OffRampSale
  sourceCurrency: string
  sourceAmount?: number
}

export interface ServiceProviderInfo {
  id: string
  name: string
  url: string
  logoLightUrl: string
  logoDarkUrl: string
  supportUrl?: string
}

export interface NFTMintTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.NFTMint
  nftSummaryInfo: NFTSummaryInfo
  purchaseCurrencyId?: string
  purchaseCurrencyAmountRaw?: string
  dappInfo?: DappInfoTransactionDetails
}

export interface NFTTradeTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.NFTTrade
  nftSummaryInfo: NFTSummaryInfo
  purchaseCurrencyId: string
  purchaseCurrencyAmountRaw: string
  tradeType: NFTTradeType
}

export interface NFTApproveTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.NFTApprove
  nftSummaryInfo: NFTSummaryInfo
  spender: string
  dappInfo?: DappInfoTransactionDetails
}

export interface WCConfirmInfo extends BaseTransactionInfo {
  type: TransactionType.WCConfirm
  dapp: DappInfo
}

export interface DappInfoTransactionDetails {
  name?: string
  address?: string
  icon?: string
}

export interface UnknownTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.Unknown
  tokenAddress?: string
  dappInfo?: DappInfoTransactionDetails
}

export type TransactionTypeInfo =
  | ApproveTransactionInfo
  | BridgeTransactionInfo
  | ExactOutputSwapTransactionInfo
  | ExactInputSwapTransactionInfo
  | ConfirmedSwapTransactionInfo
  | WrapTransactionInfo
  | SendTokenTransactionInfo
  | ReceiveTokenTransactionInfo
  | NFTTradeTransactionInfo
  | NFTApproveTransactionInfo
  | NFTMintTransactionInfo
  | WCConfirmInfo
  | UnknownTransactionInfo
  | OnRampPurchaseInfo
  | OnRampTransferInfo
  | OffRampSaleInfo
  | LocalOnRampTransactionInfo
  | LocalOffRampTransactionInfo

  export function isConfirmedSwapTypeInfo(typeInfo: TransactionTypeInfo): typeInfo is ConfirmedSwapTransactionInfo {
  return Boolean(
    (typeInfo as ConfirmedSwapTransactionInfo).inputCurrencyAmountRaw &&
      (typeInfo as ConfirmedSwapTransactionInfo).outputCurrencyAmountRaw,
  )
}

export function isBridgeTypeInfo(typeInfo: TransactionTypeInfo): typeInfo is BridgeTransactionInfo {
  return typeInfo.type === TransactionType.Bridge
}

export function isFinalizedTxStatus(status: TransactionStatus): status is FinalizedTransactionStatus {
  return FINAL_STATUSES.some((finalStatus) => finalStatus === status)
}

export function isFinalizedTx(tx: TransactionDetails | FinalizedTransactionDetails): tx is FinalizedTransactionDetails {
  const validateFinalizedTx = (): FinalizedTransactionDetails | undefined => {
    const { status, hash } = tx
    if (status === TransactionStatus.Success) {
      if (!hash) {
        return undefined
      }
      return { ...tx, status, hash }
    } else if (isFinalizedTxStatus(status)) {
      return { ...tx, status }
    }
    return undefined
  }

  // Validation fn prevents & future-proofs the typeguard from illicit casting
  return Boolean(validateFinalizedTx())
}

export enum TransactionDetailsType {
  Transaction = 'TransactionDetails',
  OnRamp = 'OnRampTransactionDetails',
  OffRamp = 'OffRampTransactionDetails',
  UniswapXOrder = 'SwapOrderDetails',
}
