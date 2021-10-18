import { Currency } from '@uniswap/sdk-core'
import { NULL_ADDRESS } from 'src/constants/accounts'

export function currencyToKey(currency: Currency): string {
  if (currency.isToken) return currency.wrapped.address

  return NULL_ADDRESS
}
