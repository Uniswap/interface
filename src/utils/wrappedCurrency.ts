import { ChainId, Currency, WETH } from '@kyberswap/ks-sdk-core'
import { nativeOnChain } from 'constants/tokens'

export function unwrappedToken(token: Currency): Currency {
  if (token.equals(WETH[token.chainId as ChainId])) return nativeOnChain(token.chainId)

  return token
}
