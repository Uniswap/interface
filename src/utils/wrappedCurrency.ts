import { Currency, CurrencyAmount, Token, TokenAmount } from '@uniswap/sdk'
import { ChainId, BASE_CURRENCY, BASE_WRAPPED } from '../constants'

export function wrappedCurrency(currency: Currency | undefined, chainId: ChainId | undefined): Token | undefined {
  return currency instanceof Token ? currency : (chainId ? BASE_WRAPPED[chainId] : undefined)
}

export function wrappedCurrencyAmount(
  currencyAmount: CurrencyAmount | undefined,
  chainId: ChainId | undefined
): TokenAmount | undefined {
  const token = currencyAmount && chainId ? wrappedCurrency(currencyAmount.currency, chainId) : undefined
  return token && currencyAmount ? new TokenAmount(token, currencyAmount.raw) : undefined
}

export function unwrappedToken(token: Token): Currency {
  if (token.equals(BASE_WRAPPED[token.chainId])) return BASE_CURRENCY[token.chainId]

  return token
}