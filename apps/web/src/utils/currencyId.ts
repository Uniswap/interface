import { Currency } from '@uniswap/sdk-core'

/** @deprecated confusing since currencyId from packages/uniswap is formatted as `chainId-address` */
export function currencyId(currency?: Currency): string {
  if (currency?.isNative) {
    return 'ETH'
  }
  if (currency?.isToken) {
    return currency.address
  }
  throw new Error('invalid currency')
}
