import { Currency, ETHER, Token } from '@fuseio/fuse-swap-sdk'
import { BNB } from '../data/Currency'

export function currencyId(currency: Currency): string {
  if (currency === ETHER) return 'FUSE'
  if (currency === BNB) return 'BNB'
  if (currency instanceof Token) return currency.address
  throw new Error('invalid currency')
}
