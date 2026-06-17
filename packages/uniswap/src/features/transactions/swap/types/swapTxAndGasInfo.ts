import { GasEstimate, GasFeeResult, TradingApi } from '@universe/api'
import { ValidatedGasFeeResult } from 'uniswap/src/features/gas/utils'
import { SolanaTrade } from 'uniswap/src/features/transactions/swap/types/solana'
import {
  BridgeTrade,
  ChainedActionTrade,
  ClassicTrade,
  UniswapXTrade,
  UnwrapTrade,
  WrapTrade,
} from 'uniswap/src/features/transactions/swap/types/trade'
import { validateSwapTxContext } from 'uniswap/src/features/transactions/swap/types/validateSwapTxContext'
import { ValidatedPermit } from 'uniswap/src/features/transactions/swap/utils/trade'
import {
  PopulatedTransactionRequestArray,
  ValidatedTransactionRequest,
} from 'uniswap/src/features/transactions/types/transactionRequests'
import { Prettify } from 'viem'
import type { RpcUserOperation } from 'viem/account-abstraction'

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
   * `hasUnsignedPermit` is true if `txRequest` is undefined due to a permit signature needing to be signed first.
   * This occurs on interface where the user must be prompted to sign a permit before txRequest can be fetched.
   */
  hasUnsignedPermit: boolean
  /**
   * Either txRequests or unsignedUserOperation is defined.
   * When `unsignedUserOperation` is set, the swap was fetched via the 4337 endpoint and
   * paymaster + signing happen in the execute saga (see `isUserOpSwap`).
   */
  txRequests: PopulatedTransactionRequestArray | undefined
  unsignedUserOperation?: RpcUserOperation<'0.8'>
  requestUniswapGasSponsorship?: boolean
  paymasterService?: Partial<TradingApi.PaymasterServiceCapability>
}

export interface WrapSwapTxAndGasInfo extends BaseSwapTxAndGasInfo {
  routing: TradingApi.Routing.WRAP | TradingApi.Routing.UNWRAP
  trade: WrapTrade | UnwrapTrade
  /**
   * Either txRequests or unsignedUserOperation is defined
   */
  txRequests: PopulatedTransactionRequestArray | undefined
  unsignedUserOperation?: RpcUserOperation<'0.8'>
  /** Only set on the 4337 path; `undefined` for the standard EOA path. */
  requestUniswapGasSponsorship?: boolean
  paymasterService?: Partial<TradingApi.PaymasterServiceCapability>
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
  /**
   * Either txRequests or unsignedUserOperation is defined
   */
  txRequests: PopulatedTransactionRequestArray | undefined
  unsignedUserOperation?: RpcUserOperation<'0.8'>
  /** Only set on the 4337 path; `undefined` for the standard EOA path. */
  requestUniswapGasSponsorship?: boolean
  paymasterService?: Partial<TradingApi.PaymasterServiceCapability>
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

export interface ChainedSwapTxAndGasInfo extends BaseSwapTxAndGasInfo {
  routing: TradingApi.Routing.CHAINED
  planId: string | undefined
  trade: ChainedActionTrade
  txRequests: PopulatedTransactionRequestArray | undefined
  /** Not needed for Chained Actions since it's already included in the steps/txRequests */
  approveTxRequest: undefined
  /** Not needed for Chained Actions since it's already included in the steps/txRequests */
  revocationTxRequest: undefined
  gasFee: GasFeeResult
  gasFeeEstimation: SwapGasFeeEstimation
}

interface BaseRequiredSwapTxContextFields {
  gasFee: ValidatedGasFeeResult
}

/** Either txRequests or unsignedUserOperation is set after validation. */
export type ValidatedTxRequestsOrUserOp =
  | {
      txRequests: PopulatedTransactionRequestArray
      unsignedUserOperation?: undefined
      requestUniswapGasSponsorship?: undefined
    }
  | {
      txRequests: undefined
      unsignedUserOperation: RpcUserOperation<'0.8'>
      requestUniswapGasSponsorship: boolean
    }

export type ValidatedClassicSwapTxAndGasInfo = Prettify<
  Required<
    Omit<
      ClassicSwapTxAndGasInfo,
      | 'hasUnsignedPermit'
      | 'permit'
      | 'txRequests'
      | 'unsignedUserOperation'
      | 'includesDelegation'
      | 'requestUniswapGasSponsorship'
      | 'paymasterService'
    >
  > &
    Pick<ClassicSwapTxAndGasInfo, 'includesDelegation' | 'paymasterService'> &
    BaseRequiredSwapTxContextFields &
    (
      | {
          hasUnsignedPermit: true
          permit: PermitTypedData
          txRequests: undefined
          unsignedUserOperation?: undefined
          requestUniswapGasSponsorship?: undefined
        }
      | {
          hasUnsignedPermit: false
          permit: PermitTransaction | undefined
          txRequests: PopulatedTransactionRequestArray
          unsignedUserOperation?: undefined
          requestUniswapGasSponsorship?: undefined
        }
      | {
          hasUnsignedPermit: false
          permit: undefined
          txRequests: undefined
          unsignedUserOperation: RpcUserOperation<'0.8'>
          requestUniswapGasSponsorship: boolean
        }
    )
>

export type ValidatedWrapSwapTxAndGasInfo = Prettify<
  Required<
    Omit<
      WrapSwapTxAndGasInfo,
      'includesDelegation' | 'paymasterService' | 'unsignedUserOperation' | 'requestUniswapGasSponsorship'
    >
  > &
    BaseRequiredSwapTxContextFields &
    ValidatedTxRequestsOrUserOp &
    Pick<WrapSwapTxAndGasInfo, 'includesDelegation' | 'paymasterService'>
>

export type ValidatedBridgeSwapTxAndGasInfo = Prettify<
  Required<
    Omit<
      BridgeSwapTxAndGasInfo,
      'includesDelegation' | 'paymasterService' | 'unsignedUserOperation' | 'requestUniswapGasSponsorship'
    >
  > &
    BaseRequiredSwapTxContextFields &
    ValidatedTxRequestsOrUserOp &
    Pick<BridgeSwapTxAndGasInfo, 'includesDelegation' | 'paymasterService'>
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
