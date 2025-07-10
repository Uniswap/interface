import { TransactionResponse } from '@ethersproject/abstract-provider'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionStep, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import {
  ApproveTransactionInfo,
  ClaimUniTransactionInfo,
  CollectFeesTransactionInfo,
  CreatePairTransactionInfo,
  CreatePoolTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  LiquidityDecreaseTransactionInfo,
  LiquidityIncreaseTransactionInfo,
  MigrateV2LiquidityToV3TransactionInfo,
  TransactionOriginType,
  TransactionStatus,
  TransactionType as UniswapTransactionType,
  WrapTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'

export type BaseTransactionType =
  | TransactionType
  | UniswapTransactionType.Approve
  | UniswapTransactionType.Swap
  | UniswapTransactionType.ClaimUni
  | UniswapTransactionType.Wrap
  | UniswapTransactionType.MigrateLiquidityV2ToV3
  | UniswapTransactionType.CollectFees
  | UniswapTransactionType.LiquidityIncrease
  | UniswapTransactionType.LiquidityDecrease
  | UniswapTransactionType.CreatePool
  | UniswapTransactionType.CreatePair

export enum TransactionType {
  SEND = 18,
  BRIDGE = 29,
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

export interface MigrateV3LiquidityToV4TransactionInfo {
  type: TransactionType.MIGRATE_LIQUIDITY_V3_TO_V4
  currency0Id: string
  currency1Id: string
  currency0AmountRaw: string
  currency1AmountRaw: string
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
  | ClaimUniTransactionInfo
  | WrapTransactionInfo
  | MigrateV2LiquidityToV3TransactionInfo
  | CollectFeesTransactionInfo
  | SendTransactionInfo
  | LiquidityIncreaseTransactionInfo
  | LiquidityDecreaseTransactionInfo
  | BridgeTransactionInfo
  | CreatePoolTransactionInfo
  | CreatePairTransactionInfo
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
