import { Currency } from '@uniswap/sdk-core'
import { getValidAddress, shortenAddress } from 'uniswap/src/utils/addresses'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { LocalizationContextState } from 'wallet/src/features/language/LocalizationContext'
import { ValueType, getCurrencyAmount } from 'wallet/src/utils/getCurrencyAmount'

export function getFormattedCurrencyAmount(
  currency: Maybe<Currency>,
  currencyAmountRaw: string,
  formatter: LocalizationContextState,
  isApproximateAmount = false,
  valueType = ValueType.Raw,
): string {
  const currencyAmount = getCurrencyAmount({
    value: currencyAmountRaw,
    valueType,
    currency,
  })

  if (!currencyAmount) {
    return ''
  }

  const formattedAmount = formatter.formatCurrencyAmount({ value: currencyAmount })
  return isApproximateAmount ? `~${formattedAmount} ` : `${formattedAmount} `
}

export function getCurrencyDisplayText(
  currency: Maybe<Currency>,
  tokenAddressString: Address | undefined,
): string | undefined {
  const symbolDisplayText = getSymbolDisplayText(currency?.symbol)

  if (symbolDisplayText) {
    return symbolDisplayText
  }

  return tokenAddressString && getValidAddress(tokenAddressString, true)
    ? shortenAddress(tokenAddressString)
    : tokenAddressString
}
