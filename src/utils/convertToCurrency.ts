import { CurrencyAmount, JSBI } from '@harmony-swoop/sdk'

export default function convertToCurrency(amount: string): CurrencyAmount {
  return CurrencyAmount.ether(JSBI.BigInt(amount.toString()))
}
