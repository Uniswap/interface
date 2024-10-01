import { Routing, NullablePermit, CreateSwapRequest, OrderRequest } from "uniswap/src/data/tradingApi/__generated__/index"
import { GasFeeResult } from "uniswap/src/features/gas/types"
import { ClassicTrade, IndicativeTrade, UniswapXTrade } from "uniswap/src/features/transactions/swap/types/trade"
import { isClassic, isUniswapX } from "uniswap/src/features/transactions/swap/utils/routing"
import { ValidatedTransactionRequest } from "uniswap/src/features/transactions/swap/utils/trade"
import { GasFeeEstimates } from "uniswap/src/features/transactions/types/transactionDetails"

export type SwapTxAndGasInfo = ClassicSwapTxAndGasInfo | UniswapXSwapTxAndGasInfo
export type ValidatedSwapTxContext = ValidatedClassicSwapTxAndGasInfo | ValidatedUniswapXSwapTxAndGasInfo

export function isValidSwapTxContext(swapTxContext: SwapTxAndGasInfo): swapTxContext is ValidatedSwapTxContext {
  // Validation fn prevents/future-proofs typeguard against illicit casts
  return validateSwapTxContext(swapTxContext) !== undefined
}

export type SwapGasFeeEstimation = {
  swapEstimates?: GasFeeEstimates
  approvalEstimates?: GasFeeEstimates
}

export type UniswapXGasBreakdown = {
  classicGasUseEstimateUSD?: string
  approvalCost?: string
  wrapCost?: string
  inputTokenSymbol?: string
}

interface BaseSwapTxAndGasInfo {
  routing: Routing
  trade?: ClassicTrade | UniswapXTrade
  indicativeTrade: IndicativeTrade | undefined
  approvalError: boolean
  permitData: NullablePermit | undefined
  permitDataLoading: boolean | undefined
  approveTxRequest: ValidatedTransactionRequest | undefined
  revocationTxRequest: ValidatedTransactionRequest | undefined
  gasFee: GasFeeResult
}

export interface ClassicSwapTxAndGasInfo extends BaseSwapTxAndGasInfo {
  routing: Routing.CLASSIC
  trade?: ClassicTrade
  txRequest?: ValidatedTransactionRequest
  swapRequestArgs: CreateSwapRequest | undefined
  permitSignature: string | undefined
  gasFeeEstimation: SwapGasFeeEstimation
}

export interface UniswapXSwapTxAndGasInfo extends BaseSwapTxAndGasInfo {
  routing: Routing.DUTCH_V2
  trade: UniswapXTrade
  wrapTxRequest: ValidatedTransactionRequest | undefined
  orderParams?: OrderRequest
  gasFeeBreakdown: UniswapXGasBreakdown
}
interface BaseRequiredSwapTxContextFields {
  approvalError: false
  gasFee: ValidatedGasFeeResult
}

type ValidatedClassicSwapTxAndGasInfo = Required<ClassicSwapTxAndGasInfo> & BaseRequiredSwapTxContextFields
type ValidatedUniswapXSwapTxAndGasInfo = Required<UniswapXSwapTxAndGasInfo> & BaseRequiredSwapTxContextFields

function validateSwapTxContext(swapTxContext: SwapTxAndGasInfo): ValidatedSwapTxContext | undefined {
  const gasFee = validateGasFeeResult(swapTxContext.gasFee)
  if (!gasFee) {
    return undefined
  }

  if (!swapTxContext.approvalError && swapTxContext.trade) {
    const { approvalError } = swapTxContext
    if (isClassic(swapTxContext) && swapTxContext.trade && swapTxContext.txRequest) {
      const { trade, txRequest } = swapTxContext
      return { ...swapTxContext, trade, txRequest, approvalError, gasFee }
    } else if (isUniswapX(swapTxContext) && swapTxContext.orderParams) {
      const { trade, orderParams } = swapTxContext
      return { ...swapTxContext, trade, gasFee, approvalError, orderParams }
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

