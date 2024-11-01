import { Currency, Price, Token } from '@uniswap/sdk-core'
import { tickToPrice } from '@uniswap/v3-sdk'
import { tickToPrice as tickToPriceV4 } from '@uniswap/v4-sdk'

export function getTickToPrice(baseToken?: Token, quoteToken?: Token, tick?: number): Price<Token, Token> | undefined {
  if (!baseToken || !quoteToken || typeof tick !== 'number') {
    return undefined
  }
  return tickToPrice(baseToken, quoteToken, tick)
}

export function getV4TickToPrice(
  baseCurrency?: Currency,
  quoteCurrency?: Currency,
  tick?: number,
): Price<Currency, Currency> | undefined {
  if (!baseCurrency || !quoteCurrency || typeof tick !== 'number') {
    return undefined
  }
  return tickToPriceV4(baseCurrency, quoteCurrency, tick)
}
