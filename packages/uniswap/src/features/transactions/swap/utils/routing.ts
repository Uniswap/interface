import { ADDRESS_ZERO } from '@uniswap/v3-sdk'
import type { ChainedQuoteResponse } from '@universe/api'
import { TradingApi } from '@universe/api'
import { UnexpectedTransactionStateError } from 'uniswap/src/features/transactions/errors'
import { type SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { type ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'

export const UNISWAPX_ROUTING_VARIANTS = [
  TradingApi.Routing.DUTCH_V2,
  TradingApi.Routing.DUTCH_V3,
  TradingApi.Routing.DUTCH_LIMIT,
  TradingApi.Routing.PRIORITY,
] as const
type UniswapXRouting = (typeof UNISWAPX_ROUTING_VARIANTS)[number]

export function isUniswapX<T extends { routing: TradingApi.Routing }>(
  obj: T,
): obj is Extract<T, { routing: UniswapXRouting }> {
  return UNISWAPX_ROUTING_VARIANTS.includes(obj.routing as UniswapXRouting)
}

export function isClassic<T extends { routing: TradingApi.Routing }>(
  obj: T,
): obj is Extract<T, { routing: TradingApi.Routing.CLASSIC }> {
  return obj.routing === TradingApi.Routing.CLASSIC
}

export function isBridge<T extends { routing: TradingApi.Routing }>(
  obj: T,
): obj is Extract<T, { routing: TradingApi.Routing.BRIDGE }> {
  return obj.routing === TradingApi.Routing.BRIDGE
}

export function isWrap<T extends { routing: TradingApi.Routing }>(
  obj: T,
): obj is Extract<T, { routing: TradingApi.Routing.WRAP | TradingApi.Routing.UNWRAP }> {
  return obj.routing === TradingApi.Routing.WRAP || obj.routing === TradingApi.Routing.UNWRAP
}

export function isJupiter<T extends { routing: TradingApi.Routing }>(
  obj: T,
): obj is Extract<T, { routing: TradingApi.Routing.JUPITER }> {
  return obj.routing === TradingApi.Routing.JUPITER
}

export function isChained<T extends { routing: TradingApi.Routing }>(
  obj: T,
): obj is Extract<T, { routing: TradingApi.Routing.CHAINED }> {
  return obj.routing === TradingApi.Routing.CHAINED
}

export function isChainedQuoteResponse(
  quote: { routing: TradingApi.Routing } | undefined | null,
): quote is ChainedQuoteResponse {
  return quote?.routing === TradingApi.Routing.CHAINED
}

/**
 * Checks if a quote requires gas to be paid on multiple chains.
 * Returns false for non-chained quotes or quotes where the gas is paid on a single chain.
 */
export function isMultiChainGasQuote(quote: { routing: TradingApi.Routing } | undefined | null): boolean {
  if (!isChainedQuoteResponse(quote)) {
    return false
  }

  const chainIds = new Set<number>()

  quote.quote.steps?.forEach((step) => {
    if (step.tokenInChainId !== undefined) {
      chainIds.add(step.tokenInChainId)
    }
  })

  return chainIds.size > 1
}

// Returns the first EVM txRequest in a SwapTxAndGasInfo object if it exists, otherwise undefined
export function getEVMTxRequest(swapTxContext: SwapTxAndGasInfo): ValidatedTransactionRequest | undefined {
  if (isJupiter(swapTxContext) || isUniswapX(swapTxContext)) {
    return undefined
  }
  return swapTxContext.txRequests?.[0]
}

/** Asserts that a given object fits a given routing variant. */
export function requireRouting<T extends TradingApi.Routing, V extends { routing: TradingApi.Routing }>(
  val: V,
  routing: readonly T[],
): asserts val is V & { routing: T } {
  if (!routing.includes(val.routing as T)) {
    throw new UnexpectedTransactionStateError(`Expected routing ${routing}, got ${val.routing}`)
  }
}

export const ACROSS_DAPP_INFO = {
  name: 'Across API',
  address: ADDRESS_ZERO,
  icon: 'https://protocol-icons.s3.amazonaws.com/icons/across.jpg',
}

/**
 * Converts a TradingApi.PlanStepType whose steps are derived from TradingApi.Routing to TradingApi.Routing.
 *
 * @throws {Error} If the PlanStepType and TradingApi.Routing mapping fall out of sync.
 */
export function planStepTypeToTradingRoute(stepType: TradingApi.PlanStepType): Exclude<
  TradingApi.Routing,
  // Jupiter API is not supported yet
  TradingApi.Routing.JUPITER
> {
  switch (stepType) {
    case TradingApi.PlanStepType.APPROVAL_PERMIT:
    case TradingApi.PlanStepType.APPROVAL_TXN:
    case TradingApi.PlanStepType.RESET_APPROVAL_TXN:
    case TradingApi.PlanStepType.QUICKROUTE:
    case TradingApi.PlanStepType.CLASSIC:
      return TradingApi.Routing.CLASSIC
    case TradingApi.PlanStepType.DUTCH_LIMIT:
      return TradingApi.Routing.DUTCH_LIMIT
    case TradingApi.PlanStepType.DUTCH_V2:
      return TradingApi.Routing.DUTCH_V2
    case TradingApi.PlanStepType.DUTCH_V3:
      return TradingApi.Routing.DUTCH_V3
    case TradingApi.PlanStepType.BRIDGE:
      return TradingApi.Routing.BRIDGE
    case TradingApi.PlanStepType.PRIORITY:
      return TradingApi.Routing.PRIORITY
    case TradingApi.PlanStepType.WRAP:
      return TradingApi.Routing.WRAP
    case TradingApi.PlanStepType.UNWRAP:
      return TradingApi.Routing.UNWRAP
    case TradingApi.PlanStepType.LIMIT_ORDER:
      return TradingApi.Routing.LIMIT_ORDER
    case TradingApi.PlanStepType.CHAINED:
      return TradingApi.Routing.CHAINED
    default:
      throw new Error(`planStepTypeToTradingRoute: Unknown step type: ${stepType}`)
  }
}
