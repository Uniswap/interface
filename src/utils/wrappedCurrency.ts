import { ChainId, Currency, CurrencyAmount, ETHER, SPOA, Token, TokenAmount, WETH, WSPOA } from 'dxswap-sdk'

export function wrappedCurrency(currency: Currency | undefined, chainId: ChainId | undefined): Token | undefined {
  if (!chainId) {
    return currency instanceof Token ? currency : undefined
  }
  switch (currency) {
    case ETHER:
      return WETH[chainId]
    case SPOA:
      return WSPOA[chainId]
    default:
      return currency instanceof Token ? currency : undefined
  }
}

export function wrappedCurrencyAmount(
  currencyAmount: CurrencyAmount | undefined,
  chainId: ChainId | undefined
): TokenAmount | undefined {
  const token = currencyAmount && chainId ? wrappedCurrency(currencyAmount.currency, chainId) : undefined
  return token && currencyAmount ? new TokenAmount(token, currencyAmount.raw) : undefined
}

export function unwrappedToken(token: Token): Currency {
  if (token.equals(WETH[token.chainId])) return ETHER
  return token
}
