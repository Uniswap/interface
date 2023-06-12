import { Currency } from '@uniswap/sdk-core'

import { nativeOnChain, WRAPPED_NATIVE_CURRENCY } from '../constants/tokens'
import { ChainId } from './ChainId'

export function unwrappedToken(currency: Currency): Currency {
  if (currency.isNative) return currency
  const formattedChainId = ChainId(currency.chainId)
  if (formattedChainId && WRAPPED_NATIVE_CURRENCY[formattedChainId]?.equals(currency))
    return nativeOnChain(currency.chainId)
  return currency
}
