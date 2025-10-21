import { ADDRESS_ZERO } from '@uniswap/v3-sdk'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'

export const UNISWAPX_ROUTING_VARIANTS = [
  Routing.DUTCH_V2,
  Routing.DUTCH_V3,
  Routing.DUTCH_LIMIT,
  Routing.PRIORITY,
] as const
type UniswapXRouting = (typeof UNISWAPX_ROUTING_VARIANTS)[number]

export function isUniswapX<T extends { routing: Routing }>(obj: T): obj is T & { routing: UniswapXRouting } {
  return UNISWAPX_ROUTING_VARIANTS.includes(obj.routing as UniswapXRouting)
}

export function isClassic<T extends { routing: Routing }>(obj: T): obj is T & { routing: Routing.CLASSIC } {
  return obj.routing === Routing.CLASSIC
}

export function isBridge<T extends { routing: Routing }>(obj: T): obj is T & { routing: Routing.BRIDGE } {
  return obj.routing === Routing.BRIDGE
}

export function isWrap<T extends { routing: Routing }>(obj: T): obj is T & { routing: Routing.WRAP | Routing.UNWRAP } {
  return obj.routing === Routing.WRAP || obj.routing === Routing.UNWRAP
}

export function isJupiter<T extends { routing: Routing }>(obj: T): obj is T & { routing: Routing.JUPITER } {
  return obj.routing === Routing.JUPITER
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
