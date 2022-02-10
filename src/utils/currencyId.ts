import { Currency } from '@uniswap/sdk-core'
import { NATIVE_ADDRESS } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { toSupportedChainId } from 'src/utils/chainId'

export function currencyId(currency: Currency): string {
  return buildCurrencyId(currency.chainId, currencyAddress(currency))
}

export function buildCurrencyId(chainId: ChainId, address: string) {
  return `${chainId}-${address}`
}

export function currencyAddress(currency: Currency): string {
  if (currency.isNative) return NATIVE_ADDRESS
  if (currency.isToken) return currency.address
  throw new Error('invalid currency')
}

// Currency ids are formatted as `chainId-tokenddress`
export function currencyIdToAddress(_currencyId: string): Address {
  return _currencyId.split('-')[1]
}

export function currencyIdToChain(_currencyId?: string): ChainId | null {
  if (!_currencyId) return null
  return toSupportedChainId(_currencyId.split('-')[0])
}
