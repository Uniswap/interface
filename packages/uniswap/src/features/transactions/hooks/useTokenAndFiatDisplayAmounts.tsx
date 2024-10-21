import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'

interface FormattedDisplayAmountsProps {
  value: Maybe<string>
  currencyInfo: Maybe<CurrencyInfo>
  currencyAmount: Maybe<CurrencyAmount<Currency>>
  usdValue: Maybe<CurrencyAmount<Currency>>
  isFiatMode: boolean
}

/**
 * Used to get sub-text display amounts for the non-active input mode.
 *
 * If fiat mode, returns the equivalent token amount string.
 *
 * If token mode, returns the equivalent fiat amount formatted based on app currency settings.
 *
 */
export function useTokenAndFiatDisplayAmounts({
  value,
  currencyInfo,
  currencyAmount,
  usdValue,
  isFiatMode,
}: FormattedDisplayAmountsProps): string {
  const appFiatCurrency = useAppFiatCurrencyInfo()
  const { convertFiatAmountFormatted, formatCurrencyAmount, addFiatSymbolToNumber } = useLocalizationContext()

  const formattedCurrencyAmount = currencyAmount
    ? formatCurrencyAmount({ value: currencyAmount, type: NumberType.TokenTx })
    : ''

  // show a placeholder if we have no valid USD amount
  const formattedFiatValue: string = !usdValue
    ? '-'
    : convertFiatAmountFormatted(usdValue.toExact(), NumberType.FiatTokenQuantity)

  // In fiat mode, show equivalent token amount. In token mode, show equivalent fiat amount
  return useMemo((): string => {
    const currencySymbol = currencyInfo ? getSymbolDisplayText(currencyInfo.currency.symbol) : ''

    // handle no value case
    if (!value) {
      return isFiatMode
        ? `${0} ${currencySymbol}`
        : (addFiatSymbolToNumber({
            value: 0,
            currencyCode: appFiatCurrency.code,
            currencySymbol: appFiatCurrency.symbol,
          }).toString() as string)
    }

    // Handle value
    if (isFiatMode) {
      if (formattedCurrencyAmount) {
        return `${formattedCurrencyAmount} ${currencySymbol}`
      }
    } else {
      if (formattedFiatValue) {
        return formattedFiatValue
      }
    }

    // Fallback for no formatted value case
    return '0'
  }, [
    addFiatSymbolToNumber,
    appFiatCurrency.code,
    appFiatCurrency.symbol,
    currencyInfo,
    formattedCurrencyAmount,
    formattedFiatValue,
    isFiatMode,
    value,
  ])
}
