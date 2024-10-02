import { Routing, CreateSwapRequest } from "uniswap/src/data/tradingApi/__generated__/index"
import { GasFeeResult } from "uniswap/src/features/gas/types"
import { BridgeTrade, ClassicTrade, IndicativeTrade, UniswapXTrade } from "uniswap/src/features/transactions/swap/types/trade"
import { isBridge, isClassic, isUniswapX } from "uniswap/src/features/transactions/swap/utils/routing"
import { ValidatedPermit, ValidatedTransactionRequest } from "uniswap/src/features/transactions/swap/utils/trade"
import { GasFeeEstimates } from "uniswap/src/features/transactions/types/transactionDetails"
import { isInterface } from "utilities/src/platform"

export type SwapTxAndGasInfo = ClassicSwapTxAndGasInfo | UniswapXSwapTxAndGasInfo | BridgeSwapTxAndGasInfo
export type ValidatedSwapTxContext = ValidatedClassicSwapTxAndGasInfo | ValidatedUniswapXSwapTxAndGasInfo | ValidatedBridgeSwapTxAndGasInfo

export function isValidSwapTxContext(swapTxContext: SwapTxAndGasInfo): swapTxContext is ValidatedSwapTxContext {
  // Validation fn prevents/future-proofs typeguard against illicit casts
  return validateSwapTxContext(swapTxContext) !== undefined
}

export type SwapGasFeeEstimation = {
  swapEstimates?: GasFeeEstimates
  approvalEstimates?: GasFeeEstimates
  wrapEstimates?: GasFeeEstimates
}

export type UniswapXGasBreakdown = {
  classicGasUseEstimateUSD?: string
  approvalCost?: string
  wrapCost?: string
  inputTokenSymbol?: string
}

interface BaseSwapTxAndGasInfo {
  routing: Routing
  trade?: ClassicTrade | UniswapXTrade | BridgeTrade
  indicativeTrade: IndicativeTrade | undefined
  approvalError: boolean
  approveTxRequest: ValidatedTransactionRequest | undefined
  permit: ValidatedPermit | undefined
  revocationTxRequest: ValidatedTransactionRequest | undefined
  gasFee: GasFeeResult
  gasFeeEstimation: SwapGasFeeEstimation
}

export interface ClassicSwapTxAndGasInfo extends BaseSwapTxAndGasInfo {
  routing: Routing.CLASSIC
  trade?: ClassicTrade
  swapRequestArgs: CreateSwapRequest | undefined

  /**
   * `unsigned` is true if `txRequest` is undefined due to a permit signature needing to be signed first.
   * This occurs on interface where the user must be prompted to sign a permit before txRequest can be fetched.
  */
  unsigned: boolean
  txRequest: ValidatedTransactionRequest | undefined
}

export interface UniswapXSwapTxAndGasInfo extends BaseSwapTxAndGasInfo {
  routing: Routing.DUTCH_V2
  trade: UniswapXTrade
  wrapTxRequest: ValidatedTransactionRequest | undefined
  gasFeeBreakdown: UniswapXGasBreakdown
}

export interface BridgeSwapTxAndGasInfo extends BaseSwapTxAndGasInfo {
  routing: Routing.BRIDGE
  trade: BridgeTrade
  indicativeTrade: undefined
  swapRequestArgs: CreateSwapRequest | undefined
  gasFeeEstimation: SwapGasFeeEstimation

  /**
   * `unsigned` is true if `txRequest` is undefined due to a permit signature needing to be signed first.
   * This occurs on interface where the user must be prompted to sign a permit before txRequest can be fetched.
  */
  unsigned: boolean
  txRequest: ValidatedTransactionRequest | undefined
}

interface BaseRequiredSwapTxContextFields {
  approvalError: false
  gasFee: ValidatedGasFeeResult
}

export type ValidatedClassicSwapTxAndGasInfo = Required<ClassicSwapTxAndGasInfo> & BaseRequiredSwapTxContextFields & ({
  unsigned: true
  permit: ValidatedPermit
  txRequest: undefined
} | {
  unsigned: false
  permit: undefined
  txRequest: ValidatedTransactionRequest
})

type ValidatedBridgeSwapTxAndGasInfo = Required<BridgeSwapTxAndGasInfo> & BaseRequiredSwapTxContextFields & ({
  unsigned: true
  permit: ValidatedPermit
  txRequest: undefined
} | {
  unsigned: false
  permit: undefined
  txRequest: ValidatedTransactionRequest
})

export type ValidatedUniswapXSwapTxAndGasInfo = Required<UniswapXSwapTxAndGasInfo> & BaseRequiredSwapTxContextFields & {
  // Permit should always be defined for UniswapX orders
  permit: ValidatedPermit
}

function validateSwapTxContext(swapTxContext: SwapTxAndGasInfo): ValidatedSwapTxContext | undefined {
  const gasFee = validateGasFeeResult(swapTxContext.gasFee)
  if (!gasFee) {
    return undefined
  }

  if (!swapTxContext.approvalError && swapTxContext.trade) {
    const { approvalError } = swapTxContext
    if (isClassic(swapTxContext)) {
      const { trade, txRequest, unsigned, permit } = swapTxContext

      if (unsigned) {
        // SwapTxContext should only ever be unsigned / still require a signature on interface.
        if (!isInterface || !permit) {
          return undefined
        }
        return { ...swapTxContext, trade, approvalError, gasFee, unsigned, txRequest: undefined, permit }
      } else if (txRequest) {
        return { ...swapTxContext, trade, approvalError, gasFee, unsigned, txRequest, permit: undefined }
      }

    } else if (isBridge(swapTxContext)  && swapTxContext.txRequest) {
      const { trade, txRequest, unsigned, permit } = swapTxContext

      if (unsigned) {
        // SwapTxContext should only ever be unsigned / still require a signature on interface.
        if (!isInterface || !permit) {
          return undefined
        }
        return { ...swapTxContext, trade, approvalError, gasFee, unsigned, txRequest: undefined, permit }
      } else if (txRequest) {
        return { ...swapTxContext, trade, approvalError, gasFee, unsigned, txRequest, permit: undefined }
      }
    } else if (isUniswapX(swapTxContext) && swapTxContext.permit) {
      const { trade, permit } = swapTxContext
      return { ...swapTxContext, trade, gasFee, approvalError, permit }
    }
  }
  return undefined
}

type ValidatedGasFeeResult = GasFeeResult & { value: string; error: null }
function validateGasFeeResult(gasFee: GasFeeResult): ValidatedGasFeeResult | undefined {
  if (gasFee.value === undefined || gasFee.error) {
    return undefined
  }
  return { ...gasFee, value: gasFee.value, error: null }
}

