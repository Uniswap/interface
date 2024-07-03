import { Routing } from 'wallet/src/data/tradingApi/__generated__/index'

export function isUniswapX<T extends { routing: Routing }>(
  obj: T
): obj is T & { routing: Routing.DUTCH_V2 } {
  return obj.routing === Routing.DUTCH_V2
}

export function isClassic<T extends { routing: Routing }>(
  obj: T
): obj is T & { routing: Routing.CLASSIC } {
  return obj.routing === Routing.CLASSIC
}
