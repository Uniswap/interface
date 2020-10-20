import { Currency, CurrencyAmount, HARMONY, Token, TokenAmount, WONE } from '@swoop-exchange/sdk'

const { ChainID } = require("@harmony-js/utils");

export function wrappedCurrency(currency: Currency | undefined, chainId: typeof ChainID | undefined): Token | undefined {
  // @ts-ignore
  return chainId && currency === HARMONY ? WONE[chainId] : currency instanceof Token ? currency : undefined
}

export function wrappedCurrencyAmount(
  currencyAmount: CurrencyAmount | undefined,
  chainId: typeof ChainID | undefined
): TokenAmount | undefined {
  const token = currencyAmount && chainId ? wrappedCurrency(currencyAmount.currency, chainId) : undefined
  return token && currencyAmount ? new TokenAmount(token, currencyAmount.raw) : undefined
}

export function unwrappedToken(token: Token): Currency {
  if (token.equals(WONE[token.chainId])) return HARMONY
  return token
}
