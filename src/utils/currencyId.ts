import { Currency } from '@uniswap/sdk-core'
import { ChainId } from 'src/constants/chains'

export function currencyId(currency: Currency): string {
  const chainId = currency.chainId as ChainId
  if (currency.isNative) return `${chainId}-NATIVE`
  if (currency.isToken) return `${chainId}-${currency.address}`
  throw new Error('invalid currency')
}
