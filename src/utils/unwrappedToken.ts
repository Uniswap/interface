import { Currency } from '@uniswap/sdk-core'
import { toSupportedChain } from 'constants/chains'

import { nativeOnChain, WRAPPED_NATIVE_CURRENCY } from '../constants/tokens'

export function unwrappedToken(currency: Currency): Currency {
  if (currency.isNative) return currency
  const formattedChainId = toSupportedChain(currency.chainId)
  if (formattedChainId && WRAPPED_NATIVE_CURRENCY[formattedChainId]?.equals(currency))
    return nativeOnChain(currency.chainId)
  return currency
}
