import { Currency } from '@uniswap/sdk-core'
import { isSupportedChain } from 'constants/chains'

import { nativeOnChain, WRAPPED_NATIVE_CURRENCY } from '../constants/tokens'

export function unwrappedToken(currency: Currency): Currency {
  if (currency.isNative) return currency
  const formattedChainId = isSupportedChain(currency.chainId) ? currency.chainId : null
  if (formattedChainId && WRAPPED_NATIVE_CURRENCY[formattedChainId]?.equals(currency))
    return nativeOnChain(currency.chainId)
  return currency
}
