// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { IncreaseLPPositionRequest } from 'uniswap/src/data/tradingApi/__generated__'
import { ValidatedPermit, ValidatedTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'

export interface LiquidityAction {
  currency0Amount: CurrencyAmount<Currency>
  currency1Amount: CurrencyAmount<Currency>
  liquidityToken: Token
}

export type LiquidityTxAndGasInfo = IncreasePositionTxAndGasInfo
export type ValidatedLiquidityTxContext = ValidatedIncreasePositionTxAndGasInfo

export function isValidLiquidityTxContext(
  liquidityTxContext: LiquidityTxAndGasInfo | unknown,
): liquidityTxContext is ValidatedLiquidityTxContext {
  // Validation fn prevents/future-proofs typeguard against illicit casts
  return validateLiquidityTxContext(liquidityTxContext) !== undefined
}

interface BaseRequiredLiquidityTxContextFields {
  approvalError: false
}

interface BaseLiquidityTxAndGasInfo {
  protocolVersion: ProtocolVersion
  action: LiquidityAction
  approvalError: boolean
  approveToken0Request: ValidatedTransactionRequest | undefined
  approveToken1Request: ValidatedTransactionRequest | undefined
  approvePositionTokenRequest: ValidatedTransactionRequest | undefined
  permit: ValidatedPermit | undefined
  revocationTxRequest: ValidatedTransactionRequest | undefined
}

export interface IncreasePositionTxAndGasInfo extends BaseLiquidityTxAndGasInfo {
  unsigned: boolean
  increasePositionRequestArgs: IncreaseLPPositionRequest | undefined
  txRequest: ValidatedTransactionRequest | undefined
}

export type ValidatedIncreasePositionTxAndGasInfo = Required<IncreasePositionTxAndGasInfo> &
  BaseRequiredLiquidityTxContextFields &
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

function validateLiquidityTxContext(
  liquidityTxContext: LiquidityTxAndGasInfo | unknown,
): ValidatedLiquidityTxContext | undefined {
  if (!isLiquidityTx(liquidityTxContext)) {
    return undefined
  }

  if (!liquidityTxContext.approvalError && liquidityTxContext.action) {
    const { approvalError } = liquidityTxContext
    const { action, txRequest, unsigned, permit } = liquidityTxContext

    if (unsigned) {
      if (!permit) {
        return undefined
      }
      return { ...liquidityTxContext, action, approvalError, unsigned, txRequest: undefined, permit }
    } else if (txRequest) {
      return { ...liquidityTxContext, action, approvalError, unsigned, txRequest, permit: undefined }
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
