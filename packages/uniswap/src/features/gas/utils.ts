import { CurrencyAmount, NativeCurrency } from '@uniswap/sdk-core'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'

function getNativeCurrencyTotalSpend(
  value?: CurrencyAmount<NativeCurrency>,
  gasFee?: string,
  nativeCurrency?: NativeCurrency,
): Maybe<CurrencyAmount<NativeCurrency>> {
  if (!gasFee || !nativeCurrency) {
    return value
  }

  const gasFeeAmount = getCurrencyAmount({
    value: gasFee,
    valueType: ValueType.Raw,
    currency: nativeCurrency,
  })

  return value && gasFeeAmount ? gasFeeAmount.add(value) : gasFeeAmount
}

export function hasSufficientFundsIncludingGas(params: {
  transactionAmount?: CurrencyAmount<NativeCurrency>
  gasFee?: string
  nativeCurrencyBalance?: CurrencyAmount<NativeCurrency>
}): boolean {
  const { transactionAmount, gasFee, nativeCurrencyBalance } = params
  const totalSpend = getNativeCurrencyTotalSpend(transactionAmount, gasFee, nativeCurrencyBalance?.currency)
  return !totalSpend || !nativeCurrencyBalance?.lessThan(totalSpend)
}
