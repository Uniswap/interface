import type { TransactionResponse } from '@ethersproject/abstract-provider'
import type { CollectFeesSteps } from 'uniswap/src/features/transactions/liquidity/steps/collectFeesSteps'
import type { CollectLpIncentiveRewardsSteps } from 'uniswap/src/features/transactions/liquidity/steps/collectIncentiveRewardsSteps'
import type { DecreaseLiquiditySteps } from 'uniswap/src/features/transactions/liquidity/steps/decreaseLiquiditySteps'
import type { IncreaseLiquiditySteps } from 'uniswap/src/features/transactions/liquidity/steps/increaseLiquiditySteps'
import type { MigrationSteps } from 'uniswap/src/features/transactions/liquidity/steps/migrationSteps'
import { TokenApprovalTransactionStep } from 'uniswap/src/features/transactions/steps/approve'
import type { SignTypedDataStepFields } from 'uniswap/src/features/transactions/steps/permit2Signature'
import type { Permit2TransactionStep } from 'uniswap/src/features/transactions/steps/permit2Transaction'
import { TokenRevocationTransactionStep } from 'uniswap/src/features/transactions/steps/revoke'
import { WrapTransactionStep } from 'uniswap/src/features/transactions/steps/wrap'
import { ExtractedBaseTradeAnalyticsProperties } from 'uniswap/src/features/transactions/swap/analytics'
import type { ClassicSwapSteps } from 'uniswap/src/features/transactions/swap/steps/classicSteps'
import { SwapTransactionStep, SwapTransactionStepAsync } from 'uniswap/src/features/transactions/swap/steps/swap'
import type { UniswapXSwapSteps } from 'uniswap/src/features/transactions/swap/steps/uniswapxSteps'
import { SetCurrentStepFn } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { BridgeTrade, ChainedActionTrade, ClassicTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import type { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { AccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'

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

export interface HandleOnChainStepParams<T extends OnChainTransactionStep = OnChainTransactionStep> {
  account: AccountDetails
  info: TransactionTypeInfo
  step: T
  setCurrentStep: SetCurrentStepFn
  /** Controls whether the function allow submitting a duplicate tx (a tx w/ identical `info` to another recent/pending tx). Defaults to false. */
  allowDuplicativeTx?: boolean
  /** Controls whether the function should throw an error upon interrupt or not, defaults to `false`. */
  ignoreInterrupt?: boolean
  /** Controls whether the function should wait to return until after the transaction has confirmed. Defaults to `true`. */
  shouldWaitForConfirmation?: boolean
  /** Called when data returned from a submitted transaction differs from data originally sent to the wallet. */
  onModification?: (
    response: Pick<TransactionResponse, 'hash' | 'nonce' | 'data'>,
  ) => void | Generator<unknown, void, unknown>
}

export interface HandleSignatureStepParams<T extends SignatureTransactionStep = SignatureTransactionStep> {
  account: AccountDetails
  step: T
  setCurrentStep: SetCurrentStepFn
  ignoreInterrupt?: boolean
}

export type HandleApprovalStepParams = Omit<
  HandleOnChainStepParams<TokenApprovalTransactionStep | TokenRevocationTransactionStep>,
  'info'
>

export type HandleOnChainPermit2TransactionStep = Omit<HandleOnChainStepParams<Permit2TransactionStep>, 'info'>

export interface HandleSwapStepParams extends Omit<HandleOnChainStepParams, 'step' | 'info'> {
  step: SwapTransactionStep | SwapTransactionStepAsync
  signature?: string
  trade: ClassicTrade | BridgeTrade | ChainedActionTrade
  analytics: ExtractedBaseTradeAnalyticsProperties
  onTransactionHash?: (hash: string) => void
}
