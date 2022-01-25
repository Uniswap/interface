import { NativeCurrency } from './nativeCurrency'
import { Token } from './token'

export type Currency = NativeCurrency | Token

export function currencyEquals(a: Currency, b: Currency) {
  return a.equals(b)
}
