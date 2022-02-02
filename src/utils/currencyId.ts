import { Currency } from '@uniswap/sdk-core'
import { NATIVE_ADDRESS } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'

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
