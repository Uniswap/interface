import { Currency, HARMONY, Token } from '@swoop-exchange/sdk'

export function currencyId(currency: Currency): string {
  if (currency === HARMONY) return 'ONE'
  if (currency instanceof Token) return currency.address
  throw new Error('invalid currency')
}
