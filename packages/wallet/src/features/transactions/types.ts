import { AnyAction } from '@reduxjs/toolkit'
import { Protocol } from '@uniswap/router-sdk'
import { TradeType } from '@uniswap/sdk-core'
import { providers } from 'ethers'
import { Dispatch } from 'react'
import { TransactionListQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ChainId } from 'wallet/src/constants/chains'
import { AssetType } from 'wallet/src/entities/assets'
import { FORLogo, MoonpayCurrency } from 'wallet/src/features/fiatOnRamp/types'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { Warning } from 'wallet/src/features/transactions/WarningModal/types'
import { DerivedTransferInfo } from 'wallet/src/features/transactions/transfer/types'
import { QuoteType } from 'wallet/src/features/transactions/utils'
import { DappInfo } from 'wallet/src/features/walletConnect/types'

export enum WrapType {
  NotApplicable,
  Wrap,
  Unwrap,
}

export type ChainIdToTxIdToDetails = Partial<
  Record<ChainId, { [txId: string]: TransactionDetails }>
>

// Basic identifying info for a transaction
export interface TransactionId {
  chainId: ChainId
  // moonpay externalTransactionId
  id: string
}

export type TransactionListQueryResponse = NonNullable<
  NonNullable<NonNullable<TransactionListQuery['portfolios']>[0]>['assetActivities']
>[0]

export interface TransactionDetails extends TransactionId {
  ownerAddress?: Address
  from: Address

  // Specific info for the tx type
  typeInfo: TransactionTypeInfo

  // Info for status tracking
  status: TransactionStatus
  addedTime: number
  // Note: hash is mandatory for now but may be made optional if
  // we start tracking txs before they're actually sent
  hash?: string

  // Info for submitting the tx
  options: TransactionOptions

  receipt?: TransactionReceipt

  // cancelRequest is the txRequest object to be submitted
  // in attempt to cancel the current transaction
  // it should contain all the appropriate gas details in order
  // to get submitted first
  cancelRequest?: providers.TransactionRequest
}

export enum TransactionStatus {
  Canceled = 'cancelled',
  Cancelling = 'cancelling',
  FailedCancel = 'failedCancel',
  Success = 'confirmed',
  Failed = 'failed',
  Pending = 'pending',
  Replacing = 'replacing',
  Unknown = 'unknown',
  // May want more granular options here later like InMemPool
}

// Transaction confirmed on chain
export type FinalizedTransactionStatus =
  | TransactionStatus.Success
  | TransactionStatus.Failed
  | TransactionStatus.Canceled
  | TransactionStatus.FailedCancel

export interface FinalizedTransactionDetails extends TransactionDetails {
  status: FinalizedTransactionStatus
  hash: string
}

export interface TransactionOptions {
  request: providers.TransactionRequest
  timeoutMs?: number
  submitViaPrivateRpc?: boolean
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
  FiatPurchase = 'fiat-purchase',

  // General
  WCConfirm = 'wc-confirm',
  Unknown = 'unknown',
}

export interface BaseTransactionInfo {
  type: TransactionType
  transactedUSDValue?: number
  isSpam?: boolean
  externalDappInfo?: DappInfo
}

export interface ApproveTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.Approve
  tokenAddress: string
  spender: string
  approvalAmount?: string
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
  quoteType?: QuoteType
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
}

export interface SendTokenTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.Send
  assetType: AssetType
  recipient: string
  tokenAddress: string
  currencyAmountRaw?: string
  tokenId?: string // optional. NFT token id
  nftSummaryInfo?: NFTSummaryInfo // optional. NFT metadata
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

export interface FiatPurchaseTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.FiatPurchase
  id?: string
  explorerUrl?: string
  // code will be used for formatting amounts
  inputCurrency?: Pick<MoonpayCurrency, 'type' | 'code'>
  inputSymbol?: string
  inputCurrencyAmount?: number
  // metadata will be used to get the output currency
  outputCurrency?: Required<Pick<MoonpayCurrency, 'type' | 'metadata'>>
  outputSymbol?: string
  // outputCurrencyAmount can be null for failed transactions,
  // cause it's supposed to be set once transaction is complete
  // https://docs.moonpay.com/moonpay/developer-resources/api/client-side-apis/transactions
  outputCurrencyAmount?: number | null
  syncedWithBackend: boolean
  // only avaible with FOR aggregator
  serviceProviderLogo?: FORLogo
  institutionLogoUrl?: string
  serviceProvider?: string
  institution?: string
}

export interface NFTMintTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.NFTMint
  nftSummaryInfo: NFTSummaryInfo
  purchaseCurrencyId?: string
  purchaseCurrencyAmountRaw?: string
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
}

export interface WCConfirmInfo extends BaseTransactionInfo {
  type: TransactionType.WCConfirm
  dapp: DappInfo
}

export interface UnknownTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.Unknown
  tokenAddress?: string
}

export type TransactionTypeInfo =
  | ApproveTransactionInfo
  | FiatPurchaseTransactionInfo
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

export function isConfirmedSwapTypeInfo(
  typeInfo: TransactionTypeInfo
): typeInfo is ConfirmedSwapTransactionInfo {
  return Boolean(
    (typeInfo as ConfirmedSwapTransactionInfo).inputCurrencyAmountRaw &&
      (typeInfo as ConfirmedSwapTransactionInfo).outputCurrencyAmountRaw
  )
}

export function isFinalizedTx(
  tx: TransactionDetails | FinalizedTransactionDetails
): tx is FinalizedTransactionDetails {
  return (
    tx.status === TransactionStatus.Success ||
    tx.status === TransactionStatus.Failed ||
    tx.status === TransactionStatus.Canceled ||
    tx.status === TransactionStatus.FailedCancel
  )
}

export enum TransactionStep {
  FORM,
  REVIEW,
  SUBMITTED,
}

export interface TransferFlowProps {
  dispatch: Dispatch<AnyAction>
  showRecipientSelector?: boolean
  recipientSelector?: JSX.Element
  flowName: string
  derivedInfo: DerivedTransferInfo
  onClose: () => void
  txRequest?: providers.TransactionRequest
  gasFee: GasFeeResult
  step: TransactionStep
  setStep: (newStep: TransactionStep) => void
  warnings: Warning[]
  exactValue: string
  isFiatInput?: boolean
  showFiatToggle?: boolean
}
