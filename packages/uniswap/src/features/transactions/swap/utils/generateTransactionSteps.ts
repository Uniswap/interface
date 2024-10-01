import { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'
import { permit2Address } from '@uniswap/permit2-sdk'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { fetchSwap } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { CreateSwapRequest, DutchQuoteV2 } from 'uniswap/src/data/tradingApi/__generated__'
import { SwapTxAndGasInfo, isValidSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { BridgeTrade, ClassicTrade, UniswapXTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { isBridge, isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  ValidatedPermit,
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
export type OnChainTransactionStep = TransactionStep & OnChainTransactionFields
export type SignatureTransactionStep = TransactionStep & SignTypedDataStepFields

interface SignTypedDataStepFields {
  domain: TypedDataDomain
  types: Record<string, TypedDataField[]>
  values: Record<string, unknown>
}

interface OnChainTransactionFields {
  txRequest: ValidatedTransactionRequest
}

export interface WrapTransactionStep extends OnChainTransactionFields {
  type: TransactionStepType.WrapTransaction
  amount: CurrencyAmount<Currency>
}

export interface TokenApprovalTransactionStep extends OnChainTransactionFields {
  type: TransactionStepType.TokenApprovalTransaction
  token: Token
  spender: string
  amount: string
}

export interface TokenRevocationTransactionStep extends Omit<TokenApprovalTransactionStep, 'type'> {
  type: TransactionStepType.TokenRevocationTransaction
  amount: '0'
}

// Classic Swap
export interface Permit2SignatureStep extends SignTypedDataStepFields {
  type: TransactionStepType.Permit2Signature
  token: Currency
}
export interface SwapTransactionStep extends OnChainTransactionFields {
  // Swaps that don't require permit
  type: TransactionStepType.SwapTransaction
}
export interface SwapTransactionStepAsync {
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
export interface UniswapXSignatureStep extends SignTypedDataStepFields {
  type: TransactionStepType.UniswapXSignature
  deadline: number
  quote: DutchQuoteV2
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
        amount: trade.inputAmount,
      }
    : undefined
}

function createRevocationTransactionStep(
  txRequest: ValidatedTransactionRequest | undefined,
  trade: UniswapXTrade | ClassicTrade | BridgeTrade | null,
): TokenRevocationTransactionStep | undefined {
  // Revocation can copy the approval step aside from type and amount.
  const approvalStep = createApprovalTransactionStep(txRequest, trade)

  return approvalStep
    ? {
        ...approvalStep,
        type: TransactionStepType.TokenRevocationTransaction,
        amount: '0',
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

  const token = trade.inputAmount.currency.wrapped

  return txRequest
    ? {
        txRequest,
        type: TransactionStepType.TokenApprovalTransaction,
        token,
        amount: trade.inputAmount.quotient.toString(),
        spender: permit2Address(token.chainId),
      }
    : undefined
}

function createSignOrderUniswapXStep(permitData: ValidatedPermit, quote: DutchQuoteV2): UniswapXSignatureStep {
  return {
    type: TransactionStepType.UniswapXSignature,
    deadline: quote.orderInfo.deadline,
    ...permitData,
    quote,
  }
}

function createPermit2SignatureStep(
  permitData: ValidatedPermit,
  trade: UniswapXTrade | ClassicTrade | BridgeTrade,
): Permit2SignatureStep {
  return {
    type: TransactionStepType.Permit2Signature,
    domain: permitData?.domain as TypedDataDomain,
    types: permitData?.types as Record<string, TypedDataField[]>,
    values: permitData?.values as Record<string, unknown>,
    token: trade.inputAmount.currency,
  }
}

function createSwapTransactionStep(txRequest: ValidatedTransactionRequest): SwapTransactionStep {
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

      const { swap } = await fetchSwap({ ...swapRequestArgs, signature })

      return validateTransactionRequest(swap)
    },
  }
}

export function generateTransactionSteps(swapTxContext: SwapTxAndGasInfo): TransactionStep[] {
  const isValidSwap = isValidSwapTxContext(swapTxContext)

  if (!isValidSwap) {
    return []
  }

  const { trade, approveTxRequest, revocationTxRequest } = swapTxContext

  if (isClassic(swapTxContext)) {
    const { swapRequestArgs } = swapTxContext

    if (swapTxContext.unsigned) {
      return orderSwapSteps({
        revocation: createRevocationTransactionStep(revocationTxRequest, trade),
        approval: createApprovalTransactionStep(approveTxRequest, trade),
        permit: createPermit2SignatureStep(swapTxContext.permit, trade),
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
      signOrder: createSignOrderUniswapXStep(swapTxContext.permit, swapTxContext.trade.quote.quote),
    })
  } else if (isBridge(swapTxContext)) {
    const { swapRequestArgs } = swapTxContext

    if (swapTxContext.unsigned) {
      return orderSwapSteps({
        revocation: createRevocationTransactionStep(revocationTxRequest, trade),
        approval: createApprovalTransactionStep(approveTxRequest, trade),
        permit: createPermit2SignatureStep(swapTxContext.permit, trade),
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
