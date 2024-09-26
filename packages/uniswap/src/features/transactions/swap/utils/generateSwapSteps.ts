import { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'
import { Currency, Token } from '@uniswap/sdk-core'
import { fetchSwap } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { CreateSwapRequest, NullablePermit } from 'uniswap/src/data/tradingApi/__generated__'
import { SwapTxAndGasInfo, isValidSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { BridgeTrade, ClassicTrade, UniswapXTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { isBridge, isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  ValidatedTransactionRequest,
  validateTransactionRequest,
} from 'uniswap/src/features/transactions/swap/utils/trade'

export enum TransactionStepType {
  TokenApprovalTransaction = 'TokenApproval',
  TokenRevocationTransaction = 'TokenRevocation',
  SwapTransaction = 'SwapTransaction',
  WrapTransaction = 'WrapTransaction',
  SwapTransactionAsync = 'SwapTransactionAsync',
  Permit2Signature = 'Permit2Signature',
  UniswapXSignature = 'UniswapXSignature',
}

type UniswapXSwapSteps =
  | WrapTransactionStep
  | TokenApprovalTransactionStep
  | TokenRevocationTransactionStep
  | UniswapXSignatureStep

type ClassicSwapSteps =
  | TokenApprovalTransactionStep
  | TokenRevocationTransactionStep
  | Permit2SignatureStep
  | SwapTransactionStep
  | SwapTransactionStepAsync

// TODO: add v4 lp flow
export type TransactionStep = ClassicSwapSteps | UniswapXSwapSteps

interface SignTypedDataStepFields {
  domain: TypedDataDomain
  types: Record<string, TypedDataField[]>
  value: Record<string, unknown>
}

interface WrapTransactionStep {
  type: TransactionStepType.WrapTransaction
  txRequest: ValidatedTransactionRequest
  native: Token
}

interface TokenApprovalTransactionStep {
  type: TransactionStepType.TokenApprovalTransaction
  txRequest: ValidatedTransactionRequest
  token: Currency
}

interface TokenRevocationTransactionStep {
  type: TransactionStepType.TokenRevocationTransaction
  txRequest: ValidatedTransactionRequest
  token: Currency
}

// Classic Swap
interface Permit2SignatureStep extends SignTypedDataStepFields {
  type: TransactionStepType.Permit2Signature
  token: Currency
}
interface SwapTransactionStep {
  // Swaps that don't require permit
  type: TransactionStepType.SwapTransaction
  txRequest?: ValidatedTransactionRequest
}
interface SwapTransactionStepAsync {
  // Swaps that require permit
  type: TransactionStepType.SwapTransactionAsync
  getTxRequest(signature: string): Promise<ValidatedTransactionRequest | undefined> // fetches tx request from trading api with signature
}

type ClassicSwapFlow =
  | {
      revocation?: TokenRevocationTransactionStep
      approval?: TokenApprovalTransactionStep
      permit: undefined
      swap: SwapTransactionStep
    }
  | {
      revocation?: TokenRevocationTransactionStep
      approval?: TokenApprovalTransactionStep
      permit: Permit2SignatureStep
      swap: SwapTransactionStepAsync
    }

function orderSwapSteps(flow: ClassicSwapFlow): ClassicSwapSteps[] {
  const steps: ClassicSwapSteps[] = []

  if (flow.revocation) {
    steps.push(flow.revocation)
  }

  if (flow.approval) {
    steps.push(flow.approval)
  }

  if (flow.permit) {
    steps.push(flow.permit)
  }

  steps.push(flow.swap)

  return steps
}

// UniswapX
interface UniswapXSignatureStep extends SignTypedDataStepFields {
  type: TransactionStepType.UniswapXSignature
}

type UniswapXSwapFlow = {
  wrap?: WrapTransactionStep
  revocation?: TokenRevocationTransactionStep
  approval?: TokenApprovalTransactionStep
  signOrder: UniswapXSignatureStep
}

function orderUniswapXSteps(flow: UniswapXSwapFlow): UniswapXSwapSteps[] {
  const steps: UniswapXSwapSteps[] = []

  if (flow.wrap) {
    steps.push(flow.wrap)
  }

  if (flow.revocation) {
    steps.push(flow.revocation)
  }

  if (flow.approval) {
    steps.push(flow.approval)
  }

  steps.push(flow.signOrder)

  return steps
}

function createWrapTransactionStep(
  txRequest: ValidatedTransactionRequest | undefined,
  trade: UniswapXTrade | ClassicTrade | BridgeTrade | null,
): WrapTransactionStep | undefined {
  if (!trade) {
    return undefined
  }

  return txRequest
    ? {
        txRequest,
        type: TransactionStepType.WrapTransaction,
        native: trade.inputAmount.currency.wrapped,
      }
    : undefined
}

function createRevocationTransactionStep(
  txRequest: ValidatedTransactionRequest | undefined,
  trade: UniswapXTrade | ClassicTrade | BridgeTrade | null,
): TokenRevocationTransactionStep | undefined {
  if (!trade) {
    return undefined
  }

  return txRequest
    ? {
        txRequest,
        type: TransactionStepType.TokenRevocationTransaction,
        token: trade.inputAmount.currency,
      }
    : undefined
}

function createApprovalTransactionStep(
  txRequest: ValidatedTransactionRequest | undefined,
  trade: UniswapXTrade | ClassicTrade | BridgeTrade | null,
): TokenApprovalTransactionStep | undefined {
  if (!trade) {
    return undefined
  }

  return txRequest
    ? {
        txRequest,
        type: TransactionStepType.TokenApprovalTransaction,
        token: trade.inputAmount.currency,
      }
    : undefined
}

function createSignOrderUniswapXStep(permitData: NullablePermit | undefined): UniswapXSignatureStep {
  return {
    type: TransactionStepType.UniswapXSignature,
    domain: permitData?.domain as TypedDataDomain,
    types: permitData?.types as Record<string, TypedDataField[]>,
    value: permitData?.values as Record<string, unknown>,
  }
}

function createPermit2SignatureStep(
  permitData: NullablePermit | undefined,
  trade: UniswapXTrade | ClassicTrade | BridgeTrade,
): Permit2SignatureStep {
  return {
    type: TransactionStepType.Permit2Signature,
    domain: permitData?.domain as TypedDataDomain,
    types: permitData?.types as Record<string, TypedDataField[]>,
    value: permitData?.values as Record<string, unknown>,
    token: trade.inputAmount.currency,
  }
}

function createSwapTransactionStep(txRequest: ValidatedTransactionRequest | undefined): SwapTransactionStep {
  return {
    type: TransactionStepType.SwapTransaction,
    txRequest,
  }
}

function createSwapTransactionAsyncStep(swapRequestArgs: CreateSwapRequest | undefined): SwapTransactionStepAsync {
  return {
    type: TransactionStepType.SwapTransactionAsync,
    getTxRequest: async (signature: string): Promise<ValidatedTransactionRequest | undefined> => {
      if (!swapRequestArgs) {
        return undefined
      }

      const { swap } = await fetchSwap({
        ...swapRequestArgs,
        signature,
      })

      return validateTransactionRequest(swap)
    },
  }
}

export function generateSwapSteps(swapTxContext: SwapTxAndGasInfo): TransactionStep[] {
  const isValidSwap = isValidSwapTxContext(swapTxContext)

  if (!isValidSwap) {
    return []
  }

  const { trade, approveTxRequest, revocationTxRequest, permitData } = swapTxContext

  if (isClassic(swapTxContext)) {
    const { swapRequestArgs } = swapTxContext
    const isSwapAsync = !!swapTxContext.permitData && !swapTxContext.permitSignature && !swapTxContext.permitDataLoading

    if (isSwapAsync) {
      return orderSwapSteps({
        revocation: createRevocationTransactionStep(revocationTxRequest, trade),
        approval: createApprovalTransactionStep(approveTxRequest, trade),
        permit: createPermit2SignatureStep(permitData, trade),
        swap: createSwapTransactionAsyncStep(swapRequestArgs),
      })
    }

    return orderSwapSteps({
      revocation: createRevocationTransactionStep(revocationTxRequest, trade),
      approval: createApprovalTransactionStep(approveTxRequest, trade),
      permit: undefined,
      swap: createSwapTransactionStep(swapTxContext.txRequest),
    })
  } else if (isUniswapX(swapTxContext)) {
    return orderUniswapXSteps({
      revocation: createRevocationTransactionStep(revocationTxRequest, trade),
      wrap: createWrapTransactionStep(swapTxContext.wrapTxRequest, trade),
      approval: createApprovalTransactionStep(approveTxRequest, trade),
      signOrder: createSignOrderUniswapXStep(permitData),
    })
  } else if (isBridge(swapTxContext)) {
    const { swapRequestArgs } = swapTxContext
    const isSwapAsync = !!swapTxContext.permitData && !swapTxContext.permitSignature

    if (isSwapAsync) {
      return orderSwapSteps({
        revocation: createRevocationTransactionStep(revocationTxRequest, trade),
        approval: createApprovalTransactionStep(approveTxRequest, trade),
        permit: createPermit2SignatureStep(permitData, trade),
        swap: createSwapTransactionAsyncStep(swapRequestArgs),
      })
    }
    return orderSwapSteps({
      revocation: createRevocationTransactionStep(revocationTxRequest, trade),
      approval: createApprovalTransactionStep(approveTxRequest, trade),
      permit: undefined,
      swap: createSwapTransactionStep(swapTxContext.txRequest),
    })
  }

  return []
}
