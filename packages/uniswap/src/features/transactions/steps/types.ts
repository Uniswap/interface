import type { CollectFeesSteps } from 'uniswap/src/features/transactions/liquidity/steps/collectFeesSteps'
import type { CollectLpIncentiveRewardsSteps } from 'uniswap/src/features/transactions/liquidity/steps/collectIncentiveRewardsSteps'
import type { DecreaseLiquiditySteps } from 'uniswap/src/features/transactions/liquidity/steps/decreaseLiquiditySteps'
import type { IncreaseLiquiditySteps } from 'uniswap/src/features/transactions/liquidity/steps/increaseLiquiditySteps'
import type { MigrationSteps } from 'uniswap/src/features/transactions/liquidity/steps/migrationSteps'
import type { SignTypedDataStepFields } from 'uniswap/src/features/transactions/steps/permit2Signature'
import { WrapTransactionStep } from 'uniswap/src/features/transactions/steps/wrap'
import type { ClassicSwapSteps } from 'uniswap/src/features/transactions/swap/steps/classicSteps'
import type { UniswapXSwapSteps } from 'uniswap/src/features/transactions/swap/steps/uniswapxSteps'
import type { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'

export enum TransactionStepType {
  TokenApprovalTransaction = 'TokenApproval',
  TokenRevocationTransaction = 'TokenRevocation',
  SwapTransaction = 'SwapTransaction',
  SwapTransactionAsync = 'SwapTransactionAsync',
  SwapTransactionBatched = 'SwapTransactionBatched',
  WrapTransaction = 'WrapTransaction',
  Permit2Signature = 'Permit2Signature',
  Permit2Transaction = 'Permit2Transaction',
  UniswapXSignature = 'UniswapXSignature',
  IncreasePositionTransaction = 'IncreasePositionTransaction',
  IncreasePositionTransactionAsync = 'IncreasePositionTransactionAsync',
  DecreasePositionTransaction = 'DecreasePositionTransaction',
  MigratePositionTransaction = 'MigratePositionTransaction',
  MigratePositionTransactionAsync = 'MigratePositionTransactionAsync',
  CollectFeesTransactionStep = 'CollectFeesTransaction',
  CollectLpIncentiveRewardsTransactionStep = 'CollectLpIncentiveRewardsTransactionStep',
}

// TODO: add v4 lp flow
export type TransactionStep =
  | ClassicSwapSteps
  | UniswapXSwapSteps
  | IncreaseLiquiditySteps
  | DecreaseLiquiditySteps
  | MigrationSteps
  | CollectFeesSteps
  | CollectLpIncentiveRewardsSteps
  | WrapTransactionStep
export type OnChainTransactionStep = TransactionStep & OnChainTransactionFields
export type OnChainTransactionStepBatched = TransactionStep & OnChainTransactionFieldsBatched
export type SignatureTransactionStep = TransactionStep & SignTypedDataStepFields

export interface OnChainTransactionFields {
  txRequest: ValidatedTransactionRequest
}

export interface OnChainTransactionFieldsBatched {
  batchedTxRequests: ValidatedTransactionRequest[]
}
