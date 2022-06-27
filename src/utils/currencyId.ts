import { Currency } from '@uniswap/sdk-core'
import { NATIVE_ADDRESS, NATIVE_ADDRESS_ALT } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { toSupportedChainId } from 'src/utils/chainId'

export type CurrencyId = string

export function currencyId(currency: Currency): CurrencyId {
  return buildCurrencyId(currency.chainId, currencyAddress(currency))
}

export function buildCurrencyId(chainId: ChainId, address: string) {
  return `${chainId}-${address}`
}

export function currencyAddress(currency: Currency): string {
  if (currency.isNative) {
    if (currency.chainId === ChainId.Polygon) return NATIVE_ADDRESS_ALT
    else return NATIVE_ADDRESS
  }
  if (currency.isToken) return currency.address
  throw new Error('invalid currency')
}

export const isNativeCurrencyAddress = (address: Address) =>
  address === NATIVE_ADDRESS || address === NATIVE_ADDRESS_ALT

// Currency ids are formatted as `chainId-tokenddress`
export function currencyIdToAddress(_currencyId: string): Address {
  return _currencyId.split('-')[1]
}

export function currencyIdToChain(_currencyId?: string): ChainId | null {
  if (!_currencyId) return null
  return toSupportedChainId(_currencyId.split('-')[0])
}
