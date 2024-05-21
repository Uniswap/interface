import { Currency, CurrencyAmount, Ether } from '@ubeswap/sdk-core'

export function getNativeCurrencyValue(currencyValues: CurrencyAmount<Currency>[]): CurrencyAmount<Currency> {
  for (const value of currencyValues) {
    if (value.currency.isNative) {
      const nativeCurrency = value.currency
      const zero = CurrencyAmount.fromRawAmount(nativeCurrency, 0)

      return currencyValues.reduce(function (prevValue: CurrencyAmount<Currency>, currValue: CurrencyAmount<Currency>) {
        const value = currValue.currency.isNative ? currValue : zero
        return prevValue.add(value)
      }, zero)
    }
  }
  return CurrencyAmount.fromRawAmount(Ether.onChain(1), 0)
}
