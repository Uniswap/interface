import { Pool, priceToClosestTick, nearestUsableTick } from '@uniswap/v3-sdk/dist/'
import { Price, Token } from '@uniswap/sdk-core'
import { tryParseAmount } from 'state/swap/hooks'

export function tryParseTick(
  baseToken: Token | undefined,
  quoteToken: Token | undefined,
  pool: Pool | undefined,
  value?: string
): number | undefined {
  if (!value || !baseToken || !quoteToken || !pool) {
    return undefined
  }

  const amount = tryParseAmount(value, quoteToken)

  const amountOne = tryParseAmount('1', baseToken)

  if (!amount || !amountOne) return undefined

  // parse the typed value into a price, token0 should always be base currency based on url
  const price = new Price(baseToken, quoteToken, amountOne.raw, amount.raw)

  const tick = priceToClosestTick(price)

  return nearestUsableTick(tick, pool.tickSpacing)
}
