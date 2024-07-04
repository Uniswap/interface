import { Routing } from 'wallet/src/data/tradingApi/__generated__/index'

export function isUniswapX<T extends { routing: Routing }>(
  obj: T,
): obj is T & { routing: Routing.DUTCH_V2 | Routing.DUTCH_LIMIT } {
  return obj.routing === Routing.DUTCH_V2 || obj.routing === Routing.DUTCH_LIMIT
}

export function isClassic<T extends { routing: Routing }>(obj: T): obj is T & { routing: Routing.CLASSIC } {
  return obj.routing === Routing.CLASSIC
}
