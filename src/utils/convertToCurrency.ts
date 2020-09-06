import { CurrencyAmount, JSBI } from '@swoop-exchange/sdk'

export default function convertToCurrency(amount: string): CurrencyAmount {
  return CurrencyAmount.ether(JSBI.BigInt(amount.toString()))
}
