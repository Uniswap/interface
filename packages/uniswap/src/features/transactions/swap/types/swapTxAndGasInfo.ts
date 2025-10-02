import { GasEstimate, TradingApi } from '@universe/api'
import { GasFeeResult, ValidatedGasFeeResult, validateGasFeeResult } from 'uniswap/src/features/gas/types'
import { SolanaTrade } from 'uniswap/src/features/transactions/swap/types/solana'
import {
  BridgeTrade,
  ChainedActionTrade,
  ClassicTrade,
  UniswapXTrade,
  UnwrapTrade,
  WrapTrade,
} from 'uniswap/src/features/transactions/swap/types/trade'
import {
  isBridge,
  isClassic,
  isJupiter,
  isUniswapX,
  isWrap,
} from 'uniswap/src/features/transactions/swap/utils/routing'
import { ValidatedPermit } from 'uniswap/src/features/transactions/swap/utils/trade'
import {
  PopulatedTransactionRequestArray,
  ValidatedTransactionRequest,
} from 'uniswap/src/features/transactions/types/transactionRequests'
import { isWebApp } from 'utilities/src/platform'
import { Prettify } from 'viem'

export type SwapTxAndGasInfo =
  | ClassicSwapTxAndGasInfo
  | UniswapXSwapTxAndGasInfo
  | BridgeSwapTxAndGasInfo
  | WrapSwapTxAndGasInfo
  | SolanaSwapTxAndGasInfo
  | ChainedSwapTxAndGasInfo
export type ValidatedSwapTxContext =
  | ValidatedClassicSwapTxAndGasInfo
  | ValidatedUniswapXSwapTxAndGasInfo
  | ValidatedBridgeSwapTxAndGasInfo
  | ValidatedWrapSwapTxAndGasInfo
  | ValidatedSolanaSwapTxAndGasInfo
  | ValidatedChainedSwapTxAndGasInfo

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
  routing: TradingApi.Routing
  trade?: ClassicTrade | UniswapXTrade | BridgeTrade | WrapTrade | UnwrapTrade | SolanaTrade | ChainedActionTrade
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
  routing: TradingApi.Routing.CLASSIC
  trade?: ClassicTrade
  permit: PermitTransaction | PermitTypedData | undefined
  swapRequestArgs: TradingApi.CreateSwapRequest | undefined
  /**
   * `unsigned` is true if `txRequest` is undefined due to a permit signature needing to be signed first.
   * This occurs on interface where the user must be prompted to sign a permit before txRequest can be fetched.
   */
  unsigned: boolean
  txRequests: PopulatedTransactionRequestArray | undefined
}

export interface WrapSwapTxAndGasInfo extends BaseSwapTxAndGasInfo {
  routing: TradingApi.Routing.WRAP | TradingApi.Routing.UNWRAP
  trade: WrapTrade | UnwrapTrade
  txRequests: PopulatedTransactionRequestArray | undefined
}

export interface UniswapXSwapTxAndGasInfo extends BaseSwapTxAndGasInfo {
  routing: TradingApi.Routing.DUTCH_V2 | TradingApi.Routing.DUTCH_V3 | TradingApi.Routing.PRIORITY
  trade: UniswapXTrade
  permit: PermitTypedData | undefined
  gasFeeBreakdown: UniswapXGasBreakdown
}

export interface BridgeSwapTxAndGasInfo extends BaseSwapTxAndGasInfo {
  routing: TradingApi.Routing.BRIDGE
  trade: BridgeTrade
  txRequests: PopulatedTransactionRequestArray | undefined
}

export interface SolanaSwapTxAndGasInfo extends BaseSwapTxAndGasInfo {
  routing: TradingApi.Routing.JUPITER
  trade: SolanaTrade
  transactionBase64?: string
  approveTxRequest: undefined
  revocationTxRequest: undefined
  gasFee: GasFeeResult
  gasFeeEstimation: SwapGasFeeEstimation
  includesDelegation: false
}

// TODO: SWAP-458 - Subject to change.
export interface ChainedSwapTxAndGasInfo extends BaseSwapTxAndGasInfo {
  routing: TradingApi.Routing.CHAINED
  trade: ChainedActionTrade
  txRequests: PopulatedTransactionRequestArray | undefined
  /** Not needed for Chained Actions since it's already included in the steps/txRequests */
  approveTxRequest: undefined
  /** Not needed for Chained Actions since it's already included in the steps/txRequests */
  revocationTxRequest: undefined
}

interface BaseRequiredSwapTxContextFields {
  gasFee: ValidatedGasFeeResult
}

export type ValidatedClassicSwapTxAndGasInfo = Prettify<
  Required<Omit<ClassicSwapTxAndGasInfo, 'includesDelegation'>> &
    BaseRequiredSwapTxContextFields &
    (
      | {
          unsigned: true
          permit: PermitTypedData
          txRequests: undefined
        }
      | {
          unsigned: false
          permit: PermitTransaction | undefined
          txRequests: PopulatedTransactionRequestArray
        }
    ) &
    Pick<ClassicSwapTxAndGasInfo, 'includesDelegation'>
>

export type ValidatedWrapSwapTxAndGasInfo = Prettify<
  Required<Omit<WrapSwapTxAndGasInfo, 'includesDelegation'>> &
    BaseRequiredSwapTxContextFields & {
      txRequests: PopulatedTransactionRequestArray
    } & Pick<WrapSwapTxAndGasInfo, 'includesDelegation'>
>

export type ValidatedBridgeSwapTxAndGasInfo = Prettify<
  Required<Omit<BridgeSwapTxAndGasInfo, 'includesDelegation'>> &
    BaseRequiredSwapTxContextFields & {
      txRequests: PopulatedTransactionRequestArray
    } & Pick<BridgeSwapTxAndGasInfo, 'includesDelegation'>
>

export type ValidatedUniswapXSwapTxAndGasInfo = Prettify<
  Required<Omit<UniswapXSwapTxAndGasInfo, 'includesDelegation'>> &
    BaseRequiredSwapTxContextFields & {
      // Permit should always be defined for UniswapX orders
      permit: PermitTypedData
    } & Pick<UniswapXSwapTxAndGasInfo, 'includesDelegation'>
>

export type ValidatedSolanaSwapTxAndGasInfo = Prettify<
  Required<SolanaSwapTxAndGasInfo> & BaseRequiredSwapTxContextFields
>

export type ValidatedChainedSwapTxAndGasInfo = Prettify<
  Required<ChainedSwapTxAndGasInfo> & BaseRequiredSwapTxContextFields
>

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
        if (!isWebApp || !permit || permit.method !== PermitMethod.TypedData) {
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
