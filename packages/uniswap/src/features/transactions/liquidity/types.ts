// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import {
  CreateLPPositionRequest,
  IncreaseLPPositionRequest,
  MigrateLPPositionRequest,
} from 'uniswap/src/data/tradingApi/__generated__'
import { ValidatedPermit, ValidatedTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'

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
  | MigrateV3PositionTxAndGasInfo
  | CollectFeesTxAndGasInfo
export type ValidatedLiquidityTxContext =
  | ValidatedIncreasePositionTxAndGasInfo
  | ValidatedDecreasePositionTxAndGasInfo
  | ValidatedCreatePositionTxAndGasInfo
  | ValidatedMigrateV3PositionTxAndGasInfo
  | ValidatedCollectFeesTxAndGasInfo

export function isValidLiquidityTxContext(
  liquidityTxContext: LiquidityTxAndGasInfo | unknown,
): liquidityTxContext is ValidatedLiquidityTxContext {
  // Validation fn prevents/future-proofs typeguard against illicit casts
  return validateLiquidityTxContext(liquidityTxContext) !== undefined
}

interface BaseLiquidityTxAndGasInfo {
  protocolVersion: ProtocolVersion
  action: LiquidityAction
  approveToken0Request: ValidatedTransactionRequest | undefined
  approveToken1Request: ValidatedTransactionRequest | undefined
  approvePositionTokenRequest: ValidatedTransactionRequest | undefined
  permit: ValidatedPermit | undefined
  revocationTxRequest: ValidatedTransactionRequest | undefined
  txRequest: ValidatedTransactionRequest | undefined
}

export interface IncreasePositionTxAndGasInfo extends BaseLiquidityTxAndGasInfo {
  type: LiquidityTransactionType.Increase
  unsigned: boolean
  increasePositionRequestArgs: IncreaseLPPositionRequest | undefined
  dependentAmount: string | undefined
}

export interface DecreasePositionTxAndGasInfo extends BaseLiquidityTxAndGasInfo {
  type: LiquidityTransactionType.Decrease
}

export interface CreatePositionTxAndGasInfo extends BaseLiquidityTxAndGasInfo {
  type: LiquidityTransactionType.Create
  unsigned: boolean
  createPositionRequestArgs: CreateLPPositionRequest | undefined
  dependentAmount: string | undefined
}

export interface MigrateV3PositionTxAndGasInfo extends BaseLiquidityTxAndGasInfo {
  type: LiquidityTransactionType.Migrate
  migratePositionRequestArgs: MigrateLPPositionRequest | undefined
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
        permit: ValidatedPermit
        txRequest: undefined
      }
    | {
        unsigned: false
        permit: undefined
        txRequest: ValidatedTransactionRequest
      }
  )

export type ValidatedDecreasePositionTxAndGasInfo = Required<DecreasePositionTxAndGasInfo> & {
  txRequest: ValidatedTransactionRequest
}

export type ValidatedCreatePositionTxAndGasInfo = Required<CreatePositionTxAndGasInfo> &
  (
    | {
        unsigned: true
        permit: ValidatedPermit
        txRequest: undefined
      }
    | {
        unsigned: false
        permit: undefined
        txRequest: ValidatedTransactionRequest
      }
  )

export type ValidatedMigrateV3PositionTxAndGasInfo = Required<MigrateV3PositionTxAndGasInfo> &
  (
    | {
        unsigned: true
        permit: ValidatedPermit
        txRequest: undefined
      }
    | {
        unsigned: false
        permit: undefined
        txRequest: ValidatedTransactionRequest
      }
  )

export type ValidatedCollectFeesTxAndGasInfo = CollectFeesTxAndGasInfo & {
  txRequest: ValidatedTransactionRequest
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

  if (liquidityTxContext.action) {
    const { action, txRequest, permit } = liquidityTxContext
    const unsigned =
      (liquidityTxContext.type === 'increase' || liquidityTxContext.type === 'create') && liquidityTxContext.unsigned
    if (unsigned) {
      if (!permit) {
        return undefined
      }
      return { ...liquidityTxContext, action, unsigned, txRequest: undefined, permit }
    } else if (txRequest) {
      return { ...liquidityTxContext, action, unsigned, txRequest, permit: undefined }
    }
  }

  return undefined
}

function isLiquidityTx(liquidityTxContext: unknown): liquidityTxContext is LiquidityTxAndGasInfo {
  return (
    typeof liquidityTxContext === 'object' &&
    liquidityTxContext !== null &&
    'action' in liquidityTxContext &&
    'protocolVersion' in liquidityTxContext
  )
}
