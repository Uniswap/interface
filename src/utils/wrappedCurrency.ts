import { ChainId, Currency, ETHER, Token, WETH } from '@uniswap/sdk'

export function wrappedCurrency(currency: Currency | undefined, chainId: ChainId | undefined): Token | undefined {
  return chainId && currency === ETHER ? WETH[chainId] : undefined
}
