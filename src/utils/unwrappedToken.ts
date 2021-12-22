import { Currency } from '@uniswap/sdk-core'

import { ExtendedXDC } from '../constants/extended-xdc'
import { WETH_EXTENDED } from '../constants/tokens'
import { supportedChainId } from './supportedChainId'

export function unwrappedToken(currency: Currency): Currency {
  if (currency.isNative) return currency
  const formattedChainId = supportedChainId(currency.chainId)
  if (formattedChainId && currency.equals(WETH_EXTENDED[formattedChainId])) {
    return ExtendedXDC.onChain(currency.chainId)
  }
  return currency
}
