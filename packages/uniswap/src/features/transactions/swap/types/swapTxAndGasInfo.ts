import { Routing, CreateSwapRequest } from "uniswap/src/data/tradingApi/__generated__/index"
import { GasEstimate } from "uniswap/src/data/tradingApi/types"
import { GasFeeResult, ValidatedGasFeeResult, validateGasFeeResult } from "uniswap/src/features/gas/types"
import { SolanaTrade } from "uniswap/src/features/transactions/swap/types/solana"
import { BridgeTrade, ClassicTrade, UniswapXTrade, UnwrapTrade, WrapTrade } from "uniswap/src/features/transactions/swap/types/trade"
import { isBridge, isClassic, isJupiter, isUniswapX, isWrap } from "uniswap/src/features/transactions/swap/utils/routing"
import { isInterface } from "utilities/src/platform"
import { Prettify } from "viem"
import { ValidatedPermit } from "uniswap/src/features/transactions/swap/utils/trade"
import { PopulatedTransactionRequestArray, ValidatedTransactionRequest } from "uniswap/src/features/transactions/types/transactionRequests"

export type SwapTxAndGasInfo = ClassicSwapTxAndGasInfo | UniswapXSwapTxAndGasInfo | BridgeSwapTxAndGasInfo | WrapSwapTxAndGasInfo | SolanaSwapTxAndGasInfo
export type ValidatedSwapTxContext = ValidatedClassicSwapTxAndGasInfo | ValidatedUniswapXSwapTxAndGasInfo | ValidatedBridgeSwapTxAndGasInfo | ValidatedWrapSwapTxAndGasInfo | ValidatedSolanaSwapTxAndGasInfo

export function isValidSwapTxContext(swapTxContext: SwapTxAndGasInfo): swapTxContext is ValidatedSwapTxContext {
  // Validation fn prevents/future-proofs typeguard against illicit casts
  return validateSwapTxContext(swapTxContext) !== undefined
}

export type SwapGasFeeEstimation = {
  swapEstimate?: GasEstimate
  approvalEstimate?: GasEstimate
  wrapEstimate?: GasEstimate
}

export type UniswapXGasBreakdown = {
  classicGasUseEstimateUSD?: string
  approvalCost?: string
  inputTokenSymbol?: string
}

export interface BaseSwapTxAndGasInfo {
  routing: Routing
  trade?: ClassicTrade | UniswapXTrade | BridgeTrade | WrapTrade | UnwrapTrade | SolanaTrade
  approveTxRequest: ValidatedTransactionRequest | undefined
  revocationTxRequest: ValidatedTransactionRequest | undefined
  gasFee: GasFeeResult
  gasFeeEstimation: SwapGasFeeEstimation
  includesDelegation?: boolean
}

export enum PermitMethod {
  Transaction = 'Transaction',
  TypedData = 'TypedData',
}

export type PermitTransaction = {
  method: PermitMethod.Transaction
  txRequest: ValidatedTransactionRequest
}

export type PermitTypedData = {
  method: PermitMethod.TypedData
  typedData: ValidatedPermit
}

export interface ClassicSwapTxAndGasInfo extends BaseSwapTxAndGasInfo {
  routing: Routing.CLASSIC
  trade?: ClassicTrade
  permit: PermitTransaction | PermitTypedData | undefined
  swapRequestArgs: CreateSwapRequest | undefined
  /**
   * `unsigned` is true if `txRequest` is undefined due to a permit signature needing to be signed first.
   * This occurs on interface where the user must be prompted to sign a permit before txRequest can be fetched.
  */
  unsigned: boolean
  txRequests: PopulatedTransactionRequestArray | undefined
}

export interface WrapSwapTxAndGasInfo extends BaseSwapTxAndGasInfo {
  routing: Routing.WRAP | Routing.UNWRAP
  trade: WrapTrade | UnwrapTrade
  txRequests: PopulatedTransactionRequestArray | undefined
}

export interface UniswapXSwapTxAndGasInfo extends BaseSwapTxAndGasInfo {
  routing: Routing.DUTCH_V2 | Routing.DUTCH_V3 | Routing.PRIORITY
  trade: UniswapXTrade
  permit: PermitTypedData | undefined
  gasFeeBreakdown: UniswapXGasBreakdown
}

export interface BridgeSwapTxAndGasInfo extends BaseSwapTxAndGasInfo {
  routing: Routing.BRIDGE
  trade: BridgeTrade
  txRequests: PopulatedTransactionRequestArray | undefined
}

export interface SolanaSwapTxAndGasInfo extends BaseSwapTxAndGasInfo {
  routing: Routing.JUPITER
  trade: SolanaTrade
  transactionBase64?: string
  approveTxRequest: undefined
  revocationTxRequest: undefined
  gasFee: GasFeeResult
  gasFeeEstimation: SwapGasFeeEstimation
  includesDelegation: false
}

interface BaseRequiredSwapTxContextFields {
  gasFee: ValidatedGasFeeResult
}

export type ValidatedClassicSwapTxAndGasInfo =  Prettify<Required<Omit<ClassicSwapTxAndGasInfo, 'includesDelegation'>> & BaseRequiredSwapTxContextFields & ({
  unsigned: true
  permit: PermitTypedData
  txRequests: undefined
} | {
  unsigned: false
  permit: PermitTransaction | undefined
  txRequests: PopulatedTransactionRequestArray
}) & Pick<ClassicSwapTxAndGasInfo, 'includesDelegation'>>

export type ValidatedWrapSwapTxAndGasInfo =  Prettify<Required<Omit<WrapSwapTxAndGasInfo, 'includesDelegation'>> & BaseRequiredSwapTxContextFields & {
  txRequests: PopulatedTransactionRequestArray
} & Pick<WrapSwapTxAndGasInfo, 'includesDelegation'>>

export type ValidatedBridgeSwapTxAndGasInfo =  Prettify<Required<Omit<BridgeSwapTxAndGasInfo, 'includesDelegation'>> & BaseRequiredSwapTxContextFields & ({
  txRequests: PopulatedTransactionRequestArray
}) & Pick<BridgeSwapTxAndGasInfo, 'includesDelegation'>>

export type ValidatedUniswapXSwapTxAndGasInfo =  Prettify<Required<Omit<UniswapXSwapTxAndGasInfo, 'includesDelegation'>> & BaseRequiredSwapTxContextFields & {
  // Permit should always be defined for UniswapX orders
  permit: PermitTypedData
} & Pick<UniswapXSwapTxAndGasInfo, 'includesDelegation'>>

export type ValidatedSolanaSwapTxAndGasInfo = Prettify<Required<SolanaSwapTxAndGasInfo> & BaseRequiredSwapTxContextFields>

/**
 * Validates a SwapTxAndGasInfo object without any casting and returns a ValidatedSwapTxContext object if the object is valid.
 * @param swapTxContext - The SwapTxAndGasInfo object to validate.
 * @returns A ValidatedSwapTxContext object if the object is valid, otherwise undefined.
 */
function validateSwapTxContext(swapTxContext: SwapTxAndGasInfo): ValidatedSwapTxContext | undefined {

  const gasFee = validateGasFeeResult(swapTxContext.gasFee)
  if (!gasFee) {
    return undefined
  }
  

  if (swapTxContext.trade) {
    if (isClassic(swapTxContext)) {
      const { trade, unsigned, permit, txRequests, includesDelegation } = swapTxContext

      if (unsigned) {
        // SwapTxContext should only ever be unsigned / still require a signature on interface.
        if (!isInterface || !permit || permit.method !== PermitMethod.TypedData) {
          return undefined
        }
        return { ...swapTxContext, trade, gasFee, unsigned, txRequests: undefined, permit, includesDelegation }
      } else if (txRequests) {
        return { ...swapTxContext, trade, gasFee, unsigned, txRequests, permit: undefined, includesDelegation }
      } else {
        return undefined
      }

    } else if (isBridge(swapTxContext)) {
      const { trade, txRequests, includesDelegation } = swapTxContext
      if (txRequests) {
        return { ...swapTxContext, trade, gasFee, txRequests, includesDelegation }
      } else {
        return undefined
      }
    } else if (isUniswapX(swapTxContext) && swapTxContext.permit) {
      const { trade, permit } = swapTxContext
      return { ...swapTxContext, trade, gasFee, permit, includesDelegation: false }
    } else if (isWrap(swapTxContext)) {
      const { trade, txRequests } = swapTxContext
      if (txRequests) {
        return { ...swapTxContext, trade, gasFee, txRequests, includesDelegation: false }
      } else {
        return undefined
      }
    } else if (isJupiter(swapTxContext) && swapTxContext.transactionBase64) {
      return { ...swapTxContext, transactionBase64: swapTxContext.transactionBase64, gasFee }
    } else {
      return undefined
    }
  } else {
    return undefined
  }
}
