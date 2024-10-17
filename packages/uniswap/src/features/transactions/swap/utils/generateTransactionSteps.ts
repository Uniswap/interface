import { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'
import { permit2Address } from '@uniswap/permit2-sdk'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { fetchSwap, increaseLpPosition } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import {
  CreateSwapRequest,
  DutchQuoteV2,
  IncreaseLPPositionRequest,
  PriorityQuote,
} from 'uniswap/src/data/tradingApi/__generated__'
import { LiquidityTxAndGasInfo, isValidLiquidityTxContext } from 'uniswap/src/features/transactions/liquidity/types'
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
  IncreasePositionTransaction = 'IncreasePositionTransaction',
  IncreasePositionTransactionAsync = 'IncreasePositionTransactionAsync',
  DecreasePositionTransaction = 'DecreasePositionTransaction',
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

type IncreasePositionSteps =
  | TokenApprovalTransactionStep
  | Permit2SignatureStep
  | IncreasePositionTransactionStep
  | IncreasePositionTransactionStepAsync

type DecreasePositionSteps = TokenApprovalTransactionStep | DecreasePositionTransactionStep

// TODO: add v4 lp flow
export type TransactionStep = ClassicSwapSteps | UniswapXSwapSteps | IncreasePositionSteps | DecreasePositionSteps
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
  // TODO(WEB-5083): this is used to distinguish a revoke from an approve. It can likely be replaced by a boolean because for LP stuff the amount isn't straight forward.
  amount: string
}

export interface TokenRevocationTransactionStep extends Omit<TokenApprovalTransactionStep, 'type'> {
  type: TransactionStepType.TokenRevocationTransaction
  amount: '0'
}

// Classic Swap
export interface Permit2SignatureStep extends SignTypedDataStepFields {
  type: TransactionStepType.Permit2Signature
  token: Currency // Check if this needs to handle multiple tokens for LPing
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

export interface IncreasePositionTransactionStep extends OnChainTransactionFields {
  // Doesn't require permit
  type: TransactionStepType.IncreasePositionTransaction
}

export interface IncreasePositionTransactionStepAsync {
  // Requires permit
  type: TransactionStepType.IncreasePositionTransactionAsync
  getTxRequest(signature: string): Promise<ValidatedTransactionRequest | undefined> // fetches tx request from trading api with signature
}

export interface DecreasePositionTransactionStep extends OnChainTransactionFields {
  // Doesn't require permit
  type: TransactionStepType.DecreasePositionTransaction
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

type IncreasePositionFlow =
  | {
      approvalToken0?: TokenApprovalTransactionStep
      approvalToken1?: TokenApprovalTransactionStep
      approvalPositionToken?: TokenApprovalTransactionStep
      permit: undefined
      increasePosition: IncreasePositionTransactionStep
    }
  | {
      approvalToken0?: TokenApprovalTransactionStep
      approvalToken1?: TokenApprovalTransactionStep
      approvalPositionToken?: TokenApprovalTransactionStep
      permit: Permit2SignatureStep
      increasePosition: IncreasePositionTransactionStepAsync
    }

type DecreasePositionFlow = {
  approvalPositionToken?: TokenApprovalTransactionStep
  decreasePosition: DecreasePositionTransactionStep
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

function orderIncreaseLiquiditySteps(flow: IncreasePositionFlow): IncreasePositionSteps[] {
  const steps: IncreasePositionSteps[] = []
  if (flow.approvalToken0) {
    steps.push(flow.approvalToken0)
  }

  if (flow.approvalToken1) {
    steps.push(flow.approvalToken1)
  }

  if (flow.approvalPositionToken) {
    steps.push(flow.approvalPositionToken)
  }

  if (flow.permit) {
    steps.push(flow.permit)
  }

  steps.push(flow.increasePosition)

  return steps
}

function orderDecreaseLiquiditySteps(flow: DecreasePositionFlow): DecreasePositionSteps[] {
  const steps: DecreasePositionSteps[] = []

  if (flow.approvalPositionToken) {
    steps.push(flow.approvalPositionToken)
  }

  steps.push(flow.decreasePosition)

  return steps
}

// UniswapX
export interface UniswapXSignatureStep extends SignTypedDataStepFields {
  type: TransactionStepType.UniswapXSignature
  deadline: number
  quote: DutchQuoteV2 | PriorityQuote
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
  const approvalStep = createSwapApprovalTransactionStep(txRequest, trade)

  return approvalStep
    ? {
        ...approvalStep,
        type: TransactionStepType.TokenRevocationTransaction,
        amount: '0',
      }
    : undefined
}

function createSwapApprovalTransactionStep(
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

function createLPApprovalTransactionStep(
  txRequest: ValidatedTransactionRequest | undefined,
  currency: Currency | undefined,
): TokenApprovalTransactionStep | undefined {
  if (!txRequest || !currency) {
    return undefined
  }

  const token = currency.wrapped

  return {
    txRequest,
    type: TransactionStepType.TokenApprovalTransaction,
    token,
    amount: '1', // to distinguish a revoke from an approve. the value doesn't matter
    spender: permit2Address(token.chainId),
  }
}

function createSignOrderUniswapXStep(
  permitData: ValidatedPermit,
  quote: DutchQuoteV2 | PriorityQuote,
): UniswapXSignatureStep {
  return {
    type: TransactionStepType.UniswapXSignature,
    deadline: quote.orderInfo.deadline,
    ...permitData,
    quote,
  }
}

function createPermit2SignatureStep(permitData: ValidatedPermit, token: Currency): Permit2SignatureStep {
  return {
    type: TransactionStepType.Permit2Signature,
    domain: permitData?.domain as TypedDataDomain,
    types: permitData?.types as Record<string, TypedDataField[]>,
    values: permitData?.values as Record<string, unknown>,
    token,
  }
}

function createSwapTransactionStep(txRequest: ValidatedTransactionRequest): SwapTransactionStep {
  return {
    type: TransactionStepType.SwapTransaction,
    txRequest,
  }
}

function createSwapTransactionAsyncStep(
  swapRequestArgs: CreateSwapRequest | undefined,
  v4Enabled: boolean,
): SwapTransactionStepAsync {
  return {
    type: TransactionStepType.SwapTransactionAsync,
    getTxRequest: async (signature: string): Promise<ValidatedTransactionRequest | undefined> => {
      if (!swapRequestArgs) {
        return undefined
      }

      const { swap } = await fetchSwap({
        ...swapRequestArgs,
        signature,
        /* simulating transaction provides a more accurate gas limit, and the simulation will succeed because async swap step will only occur after approval has been confirmed. */
        simulateTransaction: true,
        v4Enabled,
      })

      return validateTransactionRequest(swap)
    },
  }
}

function createIncreasePositionStep(txRequest: ValidatedTransactionRequest): IncreasePositionTransactionStep {
  return {
    type: TransactionStepType.IncreasePositionTransaction,
    txRequest,
  }
}

function createIncreasePositionAsyncStep(
  increasePositionRequestArgs: IncreaseLPPositionRequest | undefined,
): IncreasePositionTransactionStepAsync {
  return {
    type: TransactionStepType.IncreasePositionTransactionAsync,

    getTxRequest: async (/* TODO(WEB-5084): accept the signature here*/): Promise<
      ValidatedTransactionRequest | undefined
    > => {
      if (!increasePositionRequestArgs) {
        return undefined
      }

      const { increase } = await increaseLpPosition({
        ...increasePositionRequestArgs /** TODO(WEB-5084): add the signature here */,
      })

      return validateTransactionRequest(increase)
    },
  }
}

function createDecreasePositionStep(txRequest: ValidatedTransactionRequest): DecreasePositionTransactionStep {
  return {
    type: TransactionStepType.DecreasePositionTransaction,
    txRequest,
  }
}

export function generateTransactionSteps(
  txContext: SwapTxAndGasInfo | LiquidityTxAndGasInfo,
  v4Enabled = false,
): TransactionStep[] {
  const isValidSwap = isValidSwapTxContext(txContext)
  const isValidLP = isValidLiquidityTxContext(txContext)

  if (isValidLP) {
    const { action, approveToken0Request, approveToken1Request, approvePositionTokenRequest } = txContext

    const approvalToken0 = createLPApprovalTransactionStep(approveToken0Request, action.currency0Amount.currency)
    const approvalToken1 = createLPApprovalTransactionStep(approveToken1Request, action.currency1Amount.currency)
    const approvalPositionToken = createLPApprovalTransactionStep(approvePositionTokenRequest, action.liquidityToken)

    switch (txContext.type) {
      case 'decrease':
        return orderDecreaseLiquiditySteps({
          approvalPositionToken,
          decreasePosition: createDecreasePositionStep(txContext.txRequest),
        })
      case 'create':
      case 'increase':
        if (txContext.unsigned) {
          return orderIncreaseLiquiditySteps({
            approvalToken0,
            approvalToken1,
            approvalPositionToken,
            permit: createPermit2SignatureStep(txContext.permit, action.currency0Amount.currency), // TODO: what about for multiple tokens
            increasePosition: createIncreasePositionAsyncStep(
              txContext.type === 'increase'
                ? txContext.increasePositionRequestArgs
                : txContext.createPositionRequestArgs,
            ),
          })
        } else {
          return orderIncreaseLiquiditySteps({
            approvalToken0,
            approvalToken1,
            approvalPositionToken,
            permit: undefined,
            increasePosition: createIncreasePositionStep(txContext.txRequest),
          })
        }
    }
  } else if (isValidSwap) {
    const { trade, approveTxRequest, revocationTxRequest } = txContext

    if (isClassic(txContext)) {
      const { swapRequestArgs } = txContext

      if (txContext.unsigned) {
        return orderSwapSteps({
          revocation: createRevocationTransactionStep(revocationTxRequest, trade),
          approval: createSwapApprovalTransactionStep(approveTxRequest, trade),
          permit: createPermit2SignatureStep(txContext.permit, trade.inputAmount.currency),
          swap: createSwapTransactionAsyncStep(swapRequestArgs, v4Enabled),
        })
      }

      return orderSwapSteps({
        revocation: createRevocationTransactionStep(revocationTxRequest, trade),
        approval: createSwapApprovalTransactionStep(approveTxRequest, trade),
        permit: undefined,
        swap: createSwapTransactionStep(txContext.txRequest),
      })
    } else if (isUniswapX(txContext)) {
      return orderUniswapXSteps({
        revocation: createRevocationTransactionStep(revocationTxRequest, trade),
        wrap: createWrapTransactionStep(txContext.wrapTxRequest, trade),
        approval: createSwapApprovalTransactionStep(approveTxRequest, trade),
        signOrder: createSignOrderUniswapXStep(txContext.permit, txContext.trade.quote.quote),
      })
    } else if (isBridge(txContext)) {
      const { swapRequestArgs } = txContext

      if (txContext.unsigned) {
        return orderSwapSteps({
          revocation: createRevocationTransactionStep(revocationTxRequest, trade),
          approval: createSwapApprovalTransactionStep(approveTxRequest, trade),
          permit: createPermit2SignatureStep(txContext.permit, trade.inputAmount.currency),
          swap: createSwapTransactionAsyncStep(swapRequestArgs, v4Enabled),
        })
      }
      return orderSwapSteps({
        revocation: createRevocationTransactionStep(revocationTxRequest, trade),
        approval: createSwapApprovalTransactionStep(approveTxRequest, trade),
        permit: undefined,
        swap: createSwapTransactionStep(txContext.txRequest),
      })
    }
  }

  return []
}
