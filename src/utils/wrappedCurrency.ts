import { ChainId, Token, TokenAmount, ETHER } from '@uniswap/sdk'

export function wrappedCurrency(currency: Token | undefined, chainId: ChainId | undefined): Token | undefined {
  return chainId && currency instanceof Token ? currency : undefined
}

export function wrappedCurrencyAmount(
  currencyAmount: TokenAmount | undefined,
  chainId: ChainId | undefined
): TokenAmount | undefined {
  const token = currencyAmount && chainId ? wrappedCurrency(currencyAmount.token, chainId) : undefined
  return token && currencyAmount ? new TokenAmount(token, currencyAmount.raw) : undefined
}

export function unwrappedToken(token: Token): Token {
  if (token.equals(ETHER)) return ETHER
  return token
}

////////// MOONISWAP ////////
export function normalizeToken(currency: Token | undefined): Token | undefined {
  if (currency?.symbol === 'ETH') {
    return new Token(1, '0x0000000000000000000000000000000000000000', 18, 'ETH', 'Ethereum')
  }
  return currency instanceof Token ? currency : undefined
}
