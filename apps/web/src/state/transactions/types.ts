import { TransactionResponse } from '@ethersproject/abstract-provider'
import { TradeType } from '@uniswap/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionStep, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import {
  ApproveTransactionInfo,
  TransactionOriginType,
  TransactionStatus,
  TransactionType as UniswapTransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'

export type BaseTransactionType = TransactionType | UniswapTransactionType.Approve

export enum TransactionType {
  SWAP = 1,
  CLAIM = 4,
  WRAP = 7,
  MIGRATE_LIQUIDITY_V2_TO_V3 = 11,
  COLLECT_FEES = 12,
  SEND = 18,
  INCREASE_LIQUIDITY = 27,
  DECREASE_LIQUIDITY = 28,
  BRIDGE = 29,
  CREATE_POSITION = 30,
  MIGRATE_LIQUIDITY_V3_TO_V4 = 31,
  LP_INCENTIVES_CLAIM_REWARDS = 32,
  PERMIT = 33,
}
interface BaseTransactionInfo {
  type: BaseTransactionType
}

export interface PermitTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.PERMIT
  tokenAddress: string
  spender: string
  amount: string
}

interface BaseSwapTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.SWAP
  tradeType: TradeType
  inputCurrencyId: string
  outputCurrencyId: string
  isUniswapXOrder: boolean
}

export interface BridgeTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.BRIDGE
  inputCurrencyId: string
  inputChainId: UniverseChainId
  inputCurrencyAmountRaw: string
  outputCurrencyId: string
  outputChainId: UniverseChainId
  outputCurrencyAmountRaw: string
  quoteId?: string
  depositConfirmed: boolean
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
export interface WrapTransactionInfo {
  type: TransactionType.WRAP
  unwrapped: boolean
  currencyAmountRaw: string
  chainId?: number
}

interface ClaimTransactionInfo {
  type: TransactionType.CLAIM
  recipient: string
  uniAmountRaw?: string
}

export interface IncreaseLiquidityTransactionInfo {
  type: TransactionType.INCREASE_LIQUIDITY
  token0CurrencyId: string
  token1CurrencyId: string
  token0CurrencyAmountRaw: string
  token1CurrencyAmountRaw: string
}

export interface DecreaseLiquidityTransactionInfo {
  type: TransactionType.DECREASE_LIQUIDITY
  token0CurrencyId: string
  token1CurrencyId: string
  token0CurrencyAmountRaw: string
  token1CurrencyAmountRaw: string
}

export interface CreatePositionTransactionInfo {
  type: TransactionType.CREATE_POSITION
  token0CurrencyId: string
  token1CurrencyId: string
  token0CurrencyAmountRaw: string
  token1CurrencyAmountRaw: string
}

export interface CollectFeesTransactionInfo {
  type: TransactionType.COLLECT_FEES
  token0CurrencyId: string
  token1CurrencyId: string
  token0CurrencyAmountRaw: string
  token1CurrencyAmountRaw: string
}

export interface MigrateV3LiquidityToV4TransactionInfo {
  type: TransactionType.MIGRATE_LIQUIDITY_V3_TO_V4
  token0CurrencyId: string
  token1CurrencyId: string
  token0CurrencyAmountRaw: string
  token1CurrencyAmountRaw: string
}

export interface MigrateV2LiquidityToV3TransactionInfo {
  type: TransactionType.MIGRATE_LIQUIDITY_V2_TO_V3
  baseCurrencyId: string
  quoteCurrencyId: string
  isFork: boolean
}

export interface SendTransactionInfo {
  type: TransactionType.SEND
  currencyId: string
  amount: string
  recipient: string
}

export type TransactionInfo =
  | ApproveTransactionInfo
  | PermitTransactionInfo
  | ExactOutputSwapTransactionInfo
  | ExactInputSwapTransactionInfo
  | ClaimTransactionInfo
  | WrapTransactionInfo
  | MigrateV2LiquidityToV3TransactionInfo
  | CollectFeesTransactionInfo
  | SendTransactionInfo
  | IncreaseLiquidityTransactionInfo
  | DecreaseLiquidityTransactionInfo
  | BridgeTransactionInfo
  | CreatePositionTransactionInfo
  | MigrateV3LiquidityToV4TransactionInfo
  | LpIncentivesClaimTransactionInfo

interface BaseTransactionDetails {
  id: string
  chainId: UniverseChainId
  hash: string
  nonce?: number

  from: Address
  status: TransactionStatus
  batchInfo?: { connectorId?: string; batchId: string; chainId: UniverseChainId }
  addedTime: number

  transactionOriginType: TransactionOriginType
  info: TransactionInfo
  cancelled?: true
}

export interface PendingTransactionDetails extends BaseTransactionDetails {
  status: TransactionStatus.Pending
  lastCheckedBlockNumber?: number
  deadline?: number
}

export interface ConfirmedTransactionDetails extends BaseTransactionDetails {
  status: TransactionStatus.Success | TransactionStatus.Failed
  confirmedTime: number
}

export type TransactionDetails = PendingTransactionDetails | ConfirmedTransactionDetails

export type VitalTxFields = Pick<TransactionResponse, 'hash' | 'nonce' | 'data'>

export interface LpIncentivesClaimTransactionInfo {
  type: TransactionType.LP_INCENTIVES_CLAIM_REWARDS
  tokenAddress: string
}

export type LpIncentivesClaimTransactionStep = TransactionStep & {
  type: TransactionStepType.CollectLpIncentiveRewardsTransactionStep
  txRequest: ValidatedTransactionRequest
}
