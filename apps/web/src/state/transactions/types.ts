import type { TransactionResponse } from '@ethersproject/abstract-provider'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { TransactionStep, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import type { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'
import type {
  ApproveTransactionInfo,
  BridgeTransactionInfo,
  ClaimUniTransactionInfo,
  CollectFeesTransactionInfo,
  CreatePairTransactionInfo,
  CreatePoolTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  LiquidityDecreaseTransactionInfo,
  LiquidityIncreaseTransactionInfo,
  MigrateV2LiquidityToV3TransactionInfo,
  MigrateV3LiquidityToV4TransactionInfo,
  Permit2ApproveTransactionInfo,
  SendTokenTransactionInfo,
  TransactionOriginType,
  TransactionStatus,
  TransactionType as UniswapTransactionType,
  WrapTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'

export type BaseTransactionType =
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
  | UniswapTransactionType.MigrateLiquidityV3ToV4
  | UniswapTransactionType.Permit2Approve
  | UniswapTransactionType.Bridge
  | UniswapTransactionType.Send
  | UniswapTransactionType.LPIncentivesClaimRewards

export type TransactionInfo =
  | ApproveTransactionInfo
  | Permit2ApproveTransactionInfo
  | ExactOutputSwapTransactionInfo
  | ExactInputSwapTransactionInfo
  | ClaimUniTransactionInfo
  | WrapTransactionInfo
  | MigrateV2LiquidityToV3TransactionInfo
  | CollectFeesTransactionInfo
  | SendTokenTransactionInfo
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
  type: UniswapTransactionType.LPIncentivesClaimRewards
  tokenAddress: string
}

export type LpIncentivesClaimTransactionStep = TransactionStep & {
  type: TransactionStepType.CollectLpIncentiveRewardsTransactionStep
  txRequest: ValidatedTransactionRequest
}
