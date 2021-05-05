import { priceToClosestTick, nearestUsableTick, FeeAmount, TICK_SPACINGS } from '@uniswap/v3-sdk/dist/'
import { Price, Token } from '@uniswap/sdk-core'
import { tryParseAmount } from 'state/swap/hooks'

export function tryParseTick(
  baseToken?: Token,
  quoteToken?: Token,
  feeAmount?: FeeAmount,
  value?: string
): number | undefined {
  if (!baseToken || !quoteToken || !feeAmount || !value) {
    return undefined
  }

  const amount = tryParseAmount(value, quoteToken)

  const amountOne = tryParseAmount('1', baseToken)

  if (!amount || !amountOne) return undefined

  // parse the typed value into a price
  const price = new Price(baseToken, quoteToken, amountOne.raw, amount.raw)

  // this function is agnostic to the base, will always return the correct tick
  const tick = priceToClosestTick(price)

  return nearestUsableTick(tick, TICK_SPACINGS[feeAmount])
}
