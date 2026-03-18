import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, Price, Token } from '@uniswap/sdk-core'
import { tickToPrice } from '@uniswap/v3-sdk'
import { tickToPrice as tickToPriceV4 } from '@uniswap/v4-sdk'

/**
 * Converts a tick to a display price, handling price inversion.
 *
 * When priceInverted is true:
 * - The stored tick is in "visual" form (matches what user sees on chart)
 * - We negate the tick to get the canonical tick for price calculation
 * - We invert the result to get the display price
 *
 * @param tick - The tick value (visual tick if inverted, canonical tick if not)
 * @param baseCurrency - The base currency for price calculation
 * @param quoteCurrency - The quote currency for price calculation
 * @param priceInverted - Whether the price display is inverted
 * @param protocolVersion - V3 or V4 protocol
 * @returns The display price as a number, or undefined if calculation fails
 */
export function getDisplayPriceFromTick({
  tick,
  baseCurrency,
  quoteCurrency,
  priceInverted,
  protocolVersion,
}: {
  tick?: number
  baseCurrency?: Maybe<Currency>
  quoteCurrency?: Maybe<Currency>
  priceInverted: boolean
  protocolVersion: ProtocolVersion
}): number | undefined {
  if (tick === undefined || !baseCurrency || !quoteCurrency) {
    return undefined
  }
  const canonicalTick = priceInverted ? -tick : tick
  let price: Price<Currency, Currency> | undefined
  if (protocolVersion === ProtocolVersion.V3) {
    // V3 requires Token type
    if (!('isToken' in baseCurrency) || !('isToken' in quoteCurrency)) {
      return undefined
    }
    price = tickToPrice(baseCurrency as Token, quoteCurrency as Token, canonicalTick)
  } else {
    price = tickToPriceV4(baseCurrency, quoteCurrency, canonicalTick)
  }
  return Number(price.toSignificant(8))
}

export function getTickToPrice({
  baseToken,
  quoteToken,
  tick,
}: {
  baseToken: Maybe<Token>
  quoteToken: Maybe<Token>
  tick?: Maybe<number>
}): Price<Token, Token> | undefined {
  if (!baseToken || !quoteToken || typeof tick !== 'number') {
    return undefined
  }
  return tickToPrice(baseToken, quoteToken, tick)
}

export function getV4TickToPrice({
  baseCurrency,
  quoteCurrency,
  tick,
}: {
  baseCurrency?: Maybe<Currency>
  quoteCurrency?: Maybe<Currency>
  tick?: Maybe<number>
}): Price<Currency, Currency> | undefined {
  if (!baseCurrency || !quoteCurrency || typeof tick !== 'number') {
    return undefined
  }
  return tickToPriceV4(baseCurrency, quoteCurrency, tick)
}
