/* eslint-disable max-lines */
import { Protocol } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { GasEstimate, GraphQLApi, TradingApi } from '@universe/api'
import { providers } from 'ethers/lib/ethers'
import { AssetType } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DappRequestInfo, EthTransaction } from 'uniswap/src/types/walletConnect'

export type ChainIdToTxIdToDetails = Partial<
  Record<UniverseChainId, { [txId: string]: TransactionDetails | InterfaceTransactionDetails }>
>

// Basic identifying info for a transaction
export interface TransactionId {
  chainId: UniverseChainId
  // For FOR transactions, this is the externalSessionId
  id: string
}

export type TransactionListQueryResponse = NonNullable<
  NonNullable<NonNullable<GraphQLApi.TransactionListQuery['portfolios']>[0]>['assetActivities']
>[0]

/**
 * Marks if a transaction was initiated natively within app, or from external source.
 * External transactions are initiated from dapps, WC, uwulink, etc.
 */
export enum TransactionOriginType {
  Internal = 'internal',
  External = 'external',
}

export interface TransactionDetailsCore extends TransactionId {
  /** On-chain sender address */
  from: Address
  /** Address of the wallet that owns this transaction */
  ownerAddress?: Address
  transactionOriginType: TransactionOriginType
  typeInfo: TransactionTypeInfo
  status: TransactionStatus
  addedTime: number
  // Note: hash is mandatory for classic transactions and undefined for unfilled UniswapX orders
  // It may also become optional for classic if we start tracking txs before they're actually sent
  hash?: string
  // Includes nonce and confirmed time used by all platforms. Wallets also needs to store receipt
  // data for EIP-5792 batch transaction tracking
  receipt?: TransactionReceipt
  networkFee?: TransactionNetworkFee
  /** Block number for polling optimization */
  lastCheckedBlockNumber?: number
}

// Platform-specific extensions
export interface InterfaceTransactionExtensions {
  /** EIP-5792 batch transaction tracking */
  batchInfo?: { connectorId?: string; batchId: string; chainId: UniverseChainId }
  /** Transaction deadline for cleanup */
  deadline?: number
  /** Used to track if this transaction was a flashblock transaction within the instant threshold */
  isFlashblockTxWithinThreshold?: boolean
}

export interface WalletTransactionExtensions {
  // cancelRequest is the txRequest object to be submitted
  // in attempt to cancel the current transaction
  // it should contain all the appropriate gas details in order
  // to be mined first
  // TODO(MOB-3679): cancelRequest does not need to be persisted; remove from state
  cancelRequest?: providers.TransactionRequest
}

// Platform-specific base types
export type InterfaceBaseTransactionDetails = TransactionDetailsCore & InterfaceTransactionExtensions
export type WalletBaseTransactionDetails = TransactionDetailsCore & WalletTransactionExtensions

export type TransactionNetworkFee = {
  quantity: string
  tokenSymbol: string
  tokenAddress: string
  chainId: UniverseChainId
}

// Transaction type extensions that can be combined with any base type
export interface UniswapXOrderExtension {
  routing:
    | TradingApi.Routing.DUTCH_V3
    | TradingApi.Routing.DUTCH_V2
    | TradingApi.Routing.DUTCH_LIMIT
    | TradingApi.Routing.PRIORITY

  // Note: `orderHash` is an off-chain value used to track orders before they're filled on-chain.
  // UniswapX orders will also have a transaction `hash` if they become filled.
  // `orderHash` will be an undefined if the object is built from a filled order received from graphql. Once filled, it is not needed for any tracking.
  orderHash?: string

  // Used to track status of the order before it is submitted
  queueStatus?: QueuedOrderStatus

  // Contains the serialized/encoded UniswapX order data that gets submitted to the UniswapX system for execution.
  encodedOrder?: string

  // The Unix timestamp when the UniswapX order expires and can no longer be filled
  // TODO(PORT-344): Unify `expiry` field with wallet
  expiry?: number
}

export interface ClassicTransactionExtension {
  routing: TradingApi.Routing.CLASSIC

  // Info for submitting the tx
  options: TransactionOptions
}

export interface SolanaTransactionExtension {
  routing: TradingApi.Routing.JUPITER

  // Info for submitting the tx
  options: TransactionOptions
}

export interface BridgeTransactionExtension {
  routing: TradingApi.Routing.BRIDGE

  // Info for submitting the tx
  options: TransactionOptions

  sendConfirmed?: boolean
}

// Transaction types using intersection types for flexibility
export type UniswapXOrderDetails<TBase extends TransactionDetailsCore = WalletBaseTransactionDetails> = TBase &
  UniswapXOrderExtension

export type ClassicTransactionDetails<TBase extends TransactionDetailsCore = WalletBaseTransactionDetails> = TBase &
  ClassicTransactionExtension

export type SolanaTransactionDetails<TBase extends TransactionDetailsCore = WalletBaseTransactionDetails> = TBase &
  SolanaTransactionExtension

export type BridgeTransactionDetails<TBase extends TransactionDetailsCore = WalletBaseTransactionDetails> = TBase &
  BridgeTransactionExtension

// Generic union types
export type OnChainTransactionDetails<TBase extends TransactionDetailsCore = WalletBaseTransactionDetails> =
  | ClassicTransactionDetails<TBase>
  | BridgeTransactionDetails<TBase>
  | SolanaTransactionDetails<TBase>

export type TransactionDetails<TBase extends TransactionDetailsCore = WalletBaseTransactionDetails> =
  | UniswapXOrderDetails<TBase>
  | OnChainTransactionDetails<TBase>
  | SolanaTransactionDetails<TBase>

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
  AppClosed = 'appClosed',
  Stale = 'stale',
  SubmissionFailed = 'submissionFailed',
  Submitted = 'submitted',
}

// Platform-specific type aliases
export type InterfaceTransactionDetails = TransactionDetails<InterfaceBaseTransactionDetails>

export const TEMPORARY_TRANSACTION_STATUSES = [
  TransactionStatus.Pending,
  TransactionStatus.Replacing,
  TransactionStatus.Cancelling,
]

export const FINAL_STATUSES = [
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
  signTransactionDelayMs?: number
  currentBlockFetchDelayMs?: number
  timeoutTimestampMs?: number
  blockSubmitted?: number
  timeoutLogged?: boolean
  appBackgroundedWhilePending?: boolean
  submitViaPrivateRpc?: boolean
  privateRpcProvider?: 'flashbots' | 'mevblocker'
  replacedTransactionHash?: string
  includesDelegation?: boolean
  isSmartWalletTransaction?: boolean
}

export interface TransactionReceipt {
  transactionIndex: number
  blockHash: string
  blockNumber: number
  confirmedTime: number
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
  Permit2Approve = 'permit2-approve',
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

  // Send Calls
  SendCalls = 'send-calls',

  // Liquidity
  CollectFees = 'claim',
  CreatePair = 'create-pair',
  CreatePool = 'create-pool',
  LiquidityIncrease = 'liquidity-increase',
  LiquidityDecrease = 'liquidity-decrease',

  // Liquidity Migration
  MigrateLiquidityV2ToV3 = 'migrate-liquidity-v2-to-v3',
  MigrateLiquidityV3ToV4 = 'migrate-liquidity-v3-to-v4',

  // moved/converted from interface's type
  ClaimUni = 'claim-uni',
  CreatePosition = 'create-position',
  LPIncentivesClaimRewards = 'lp-incentives-claim-rewards',
  UniswapXOrder = 'uniswapx-order',

  // Smart Wallet
  RemoveDelegation = 'remove-delegation',
}

export interface BaseTransactionInfo {
  type: TransactionType
  transactedUSDValue?: number
  isSpam?: boolean
  externalDappInfo?: DappRequestInfo
  gasEstimate?: GasEstimate
  includesDelegation?: boolean
  isSmartWalletTransaction?: boolean
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

export interface Permit2ApproveTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.Permit2Approve
  spender: string
  // TODO(WEB-8090): add display for Permit2Approve in TransactionDetails and remove optionality from tokenAddress and amount
  tokenAddress?: string // interface only
  amount?: string // interface only
  dappInfo?: DappInfoTransactionDetails
}

export interface RemoveDelegationTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.RemoveDelegation
  dappInfo?: DappInfoTransactionDetails
}

export interface BaseSwapTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.Swap
  tradeType?: TradeType
  inputCurrencyId: string
  outputCurrencyId: string

  // only used by wallet
  slippageTolerance?: number
  quoteId?: string
  routeString?: string
  gasUseEstimate?: string
  protocol?: Protocol
  simulationFailureReasons?: TradingApi.TransactionFailureReason[]

  /**
   * @deprecated This is used on interface only and will be deleted soon as part of WALL-7143
   * */
  isUniswapXOrder?: boolean
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
  depositConfirmed?: boolean // interface only
}

export interface ExactInputSwapTransactionInfo extends BaseSwapTransactionInfo {
  tradeType: TradeType.EXACT_INPUT
  inputCurrencyAmountRaw: string
  expectedOutputCurrencyAmountRaw: string
  minimumOutputCurrencyAmountRaw: string
  settledOutputCurrencyAmountRaw?: string
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

export interface ClaimUniTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.ClaimUni
  recipient: string
  uniAmountRaw?: string
}

export interface WCConfirmInfo extends BaseTransactionInfo {
  type: TransactionType.WCConfirm
  dappRequestInfo: DappRequestInfo
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

export interface SendCallsTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.SendCalls
  encodedTransaction?: EthTransaction
  encodedRequestId?: string
  dappInfo?: DappInfoTransactionDetails
}

export interface LiquidityTransactionInfoBase<T extends TransactionType> extends BaseTransactionInfo {
  type: T
  currency0Id: string
  currency1Id: string
  currency0AmountRaw: string
  currency1AmountRaw: string
  dappInfo?: DappInfoTransactionDetails
}

export type LiquidityIncreaseTransactionInfo = LiquidityTransactionInfoBase<TransactionType.LiquidityIncrease>
export type LiquidityDecreaseTransactionInfo = LiquidityTransactionInfoBase<TransactionType.LiquidityDecrease>
export type CreatePairTransactionInfo = LiquidityTransactionInfoBase<TransactionType.CreatePair>
export type CreatePoolTransactionInfo = LiquidityTransactionInfoBase<TransactionType.CreatePool>
export type MigrateV3LiquidityToV4TransactionInfo = LiquidityTransactionInfoBase<TransactionType.MigrateLiquidityV3ToV4>
export type CollectFeesTransactionInfo = Optional<
  LiquidityTransactionInfoBase<TransactionType.CollectFees>,
  'currency1AmountRaw' | 'currency1Id'
>

export type LiquidityTransactionBaseInfos =
  | LiquidityIncreaseTransactionInfo
  | LiquidityDecreaseTransactionInfo
  | CreatePairTransactionInfo
  | CreatePoolTransactionInfo
  | MigrateV3LiquidityToV4TransactionInfo
  | CollectFeesTransactionInfo

export interface LpIncentivesClaimTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.LPIncentivesClaimRewards
  tokenAddress: string
}

export interface MigrateV2LiquidityToV3TransactionInfo extends BaseTransactionInfo {
  type: TransactionType.MigrateLiquidityV2ToV3
  baseCurrencyId: string
  quoteCurrencyId: string
  isFork: boolean
}

export type TransactionTypeInfo =
  | ApproveTransactionInfo
  | Permit2ApproveTransactionInfo
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
  | SendCallsTransactionInfo
  | CollectFeesTransactionInfo
  | CreatePairTransactionInfo
  | CreatePoolTransactionInfo
  | LiquidityIncreaseTransactionInfo
  | LiquidityDecreaseTransactionInfo
  | RemoveDelegationTransactionInfo
  | ClaimUniTransactionInfo
  | MigrateV2LiquidityToV3TransactionInfo
  | MigrateV3LiquidityToV4TransactionInfo
  | LpIncentivesClaimTransactionInfo

export enum TransactionDetailsType {
  Transaction = 'TransactionDetails',
  OnRamp = 'OnRampTransactionDetails',
  OffRamp = 'OffRampTransactionDetails',
  UniswapXOrder = 'SwapOrderDetails',
}
