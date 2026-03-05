import { type ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import {
  type CreateLPPositionRequest,
  type IncreaseLPPositionRequest,
  type MigrateV3ToV4LPPositionRequest,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_pb'
import { type Currency, type CurrencyAmount, type Token } from '@uniswap/sdk-core'
import {
  type PermitTransaction,
  type PermitTypedData,
} from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { type ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'

export enum LiquidityTransactionType {
  Create = 'create',
  Increase = 'increase',
  Decrease = 'decrease',
  Migrate = 'migrate',
  Collect = 'collect',
}

export interface LiquidityAction {
  type: LiquidityTransactionType
  currency0Amount: CurrencyAmount<Currency>
  currency1Amount: CurrencyAmount<Currency>
  liquidityToken?: Token
}

export type LiquidityTxAndGasInfo =
  | IncreasePositionTxAndGasInfo
  | DecreasePositionTxAndGasInfo
  | CreatePositionTxAndGasInfo
  | MigratePositionTxAndGasInfo
  | CollectFeesTxAndGasInfo
export type ValidatedLiquidityTxContext =
  | ValidatedIncreasePositionTxAndGasInfo
  | ValidatedDecreasePositionTxAndGasInfo
  | ValidatedCreatePositionTxAndGasInfo
  | ValidatedMigratePositionTxAndGasInfo
  | ValidatedCollectFeesTxAndGasInfo

export function isValidLiquidityTxContext(
  liquidityTxContext: LiquidityTxAndGasInfo | unknown,
): liquidityTxContext is ValidatedLiquidityTxContext {
  // Validation fn prevents/future-proofs typeguard against illicit casts
  return validateLiquidityTxContext(liquidityTxContext) !== undefined
}

interface BaseLiquidityTxAndGasInfo {
  canBatchTransactions: boolean
  delegatedAddress: string | null
  action: LiquidityAction
  approveToken0Request: ValidatedTransactionRequest | undefined
  approveToken1Request: ValidatedTransactionRequest | undefined
  approvePositionTokenRequest: ValidatedTransactionRequest | undefined
  permit: PermitTypedData | undefined
  token0PermitTransaction: ValidatedTransactionRequest | undefined
  token1PermitTransaction: ValidatedTransactionRequest | undefined
  positionTokenPermitTransaction: ValidatedTransactionRequest | undefined
  revokeToken0Request: ValidatedTransactionRequest | undefined
  revokeToken1Request: ValidatedTransactionRequest | undefined
  txRequest: ValidatedTransactionRequest | undefined
}

export interface IncreasePositionTxAndGasInfo extends BaseLiquidityTxAndGasInfo {
  type: LiquidityTransactionType.Increase
  unsigned: boolean
  increasePositionRequestArgs: IncreaseLPPositionRequest | undefined
  sqrtRatioX96: string | undefined
}

export interface DecreasePositionTxAndGasInfo extends BaseLiquidityTxAndGasInfo {
  type: LiquidityTransactionType.Decrease
  sqrtRatioX96: string | undefined
}

export interface CreatePositionTxAndGasInfo extends BaseLiquidityTxAndGasInfo {
  type: LiquidityTransactionType.Create
  unsigned: boolean
  createPositionRequestArgs: CreateLPPositionRequest | undefined
  sqrtRatioX96: string | undefined
}

export interface MigratePositionTxAndGasInfo extends BaseLiquidityTxAndGasInfo {
  type: LiquidityTransactionType.Migrate
  migratePositionRequestArgs: MigrateV3ToV4LPPositionRequest | undefined
}

export interface CollectFeesTxAndGasInfo {
  type: LiquidityTransactionType.Collect
  protocolVersion: ProtocolVersion
  action: LiquidityAction
  txRequest: ValidatedTransactionRequest | undefined
}

export type ValidatedIncreasePositionTxAndGasInfo = Required<IncreasePositionTxAndGasInfo> &
  (
    | {
        unsigned: true
        permit: PermitTypedData
        txRequest: undefined
      }
    | {
        unsigned: false
        permit: PermitTransaction | undefined
        txRequest: ValidatedTransactionRequest
        sqrtRatioX96: string | undefined
      }
  )

export type ValidatedDecreasePositionTxAndGasInfo = Required<DecreasePositionTxAndGasInfo> & {
  txRequest: ValidatedTransactionRequest
}

export type ValidatedCreatePositionTxAndGasInfo = Required<CreatePositionTxAndGasInfo> &
  (
    | {
        unsigned: true
        permit: PermitTypedData
        txRequest: undefined
      }
    | {
        unsigned: false
        permit: PermitTransaction | undefined
        txRequest: ValidatedTransactionRequest
        sqrtRatioX96: string | undefined
      }
  )

export type ValidatedMigratePositionTxAndGasInfo = Required<MigratePositionTxAndGasInfo> &
  (
    | {
        unsigned: true
        permit: PermitTypedData
        txRequest: undefined
      }
    | {
        unsigned: false
        permit: PermitTransaction | undefined
        txRequest: ValidatedTransactionRequest
      }
  )

export type ValidatedCollectFeesTxAndGasInfo = CollectFeesTxAndGasInfo & {
  txRequest: ValidatedTransactionRequest
  canBatchTransactions?: undefined
  delegatedAddress?: undefined
}

function validateLiquidityTxContext(
  liquidityTxContext: LiquidityTxAndGasInfo | unknown,
): ValidatedLiquidityTxContext | undefined {
  if (!isLiquidityTx(liquidityTxContext)) {
    return undefined
  }

  if (liquidityTxContext.type === LiquidityTransactionType.Collect) {
    if (liquidityTxContext.txRequest) {
      return { ...liquidityTxContext, txRequest: liquidityTxContext.txRequest }
    }

    return undefined
  }

  const { action, txRequest, permit } = liquidityTxContext
  const unsigned =
    (liquidityTxContext.type === 'increase' || liquidityTxContext.type === 'create') && liquidityTxContext.unsigned
  if (unsigned) {
    if (!permit) {
      return undefined
    }
    return { ...liquidityTxContext, action, unsigned, txRequest: undefined, permit }
  } else if (txRequest) {
    // Type-safe handling: Decrease type doesn't have 'unsigned' property
    if (liquidityTxContext.type === LiquidityTransactionType.Decrease) {
      return { ...liquidityTxContext, action, txRequest, permit: undefined }
    }
    // For Increase/Create/Migrate types with txRequest
    return { ...liquidityTxContext, action, unsigned, txRequest, permit: undefined }
  }

  return undefined
}

function isLiquidityTx(liquidityTxContext: unknown): liquidityTxContext is LiquidityTxAndGasInfo {
  return typeof liquidityTxContext === 'object' && liquidityTxContext !== null && 'action' in liquidityTxContext
}
