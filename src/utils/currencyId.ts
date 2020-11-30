import { Currency, ETHER, Token } from '@fuseio/fuse-swap-sdk'

export function currencyId(currency: Currency): string {
  if (currency === ETHER) return 'FUSE'
  if (currency instanceof Token) return currency.address
  throw new Error('invalid currency')
}
