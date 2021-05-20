import { Currency, Token, WETH9, Ether } from '@uniswap/sdk-core'
import { supportedChainId } from './supportedChainId'

export function unwrappedToken(currency: Token): Currency {
  if (currency.isNative) return currency
  const formattedChainId = supportedChainId(currency.chainId)
  if (formattedChainId && currency.equals(WETH9[formattedChainId])) return Ether.onChain(currency.chainId)
  return currency
}
