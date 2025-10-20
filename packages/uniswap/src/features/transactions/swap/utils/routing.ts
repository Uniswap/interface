import { ADDRESS_ZERO } from '@uniswap/v3-sdk'
import { TradingApi } from '@universe/api'

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

// Returns the first EVM txRequest in a SwapTxAndGasInfo object if it exists, otherwise undefined
export function getEVMTxRequest(swapTxContext: SwapTxAndGasInfo): ValidatedTransactionRequest | undefined {
  if (isJupiter(swapTxContext) || isUniswapX(swapTxContext)) {
    return undefined
  }
  return swapTxContext.txRequests?.[0]
}

export const ACROSS_DAPP_INFO = {
  name: 'Across API',
  address: ADDRESS_ZERO,
  icon: 'https://protocol-icons.s3.amazonaws.com/icons/across.jpg',
}
