import { Currency } from '@uniswap/sdk-core'

import { nativeOnChain, WRAPPED_NATIVE_CURRENCY } from '../constants/tokens'
import { supportedChainId } from './supportedChainId'

export function unwrappedToken(currency: Currency): Currency {
  if (currency.isNative) return currency
  const formattedChainId = supportedChainId(currency.chainId)
  if (formattedChainId && WRAPPED_NATIVE_CURRENCY[formattedChainId]?.equals(currency)) {
    const _nativeOnChain = nativeOnChain(currency.chainId)
    return _nativeOnChain.wrapped ? _nativeOnChain.wrapped : _nativeOnChain
  }
  return currency
}
