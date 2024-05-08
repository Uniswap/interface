import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { NumberType } from 'utilities/src/format/types'
import { useAppFiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'

interface FormattedDisplayAmountsProps {
  value: Maybe<string>
  currencyInfo: Maybe<CurrencyInfo>
  currencyAmount: Maybe<CurrencyAmount<Currency>>
  usdValue: Maybe<CurrencyAmount<Currency>>
  isFiatMode: boolean
}

/**
 * Used to get sub-text display amoounts for the non-active input mode.
 *
 * If fiat mode, returns the equivilent token amount string.
 *
 * If token mode, returns the equivilent fiat amount formatted based on app currency settings.
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
  const { convertFiatAmountFormatted, formatCurrencyAmount, addFiatSymbolToNumber } =
    useLocalizationContext()

  const formattedCurrencyAmount = currencyAmount
    ? formatCurrencyAmount({ value: currencyAmount, type: NumberType.TokenTx })
    : ''

  const formattedFiatValue: string = convertFiatAmountFormatted(
    usdValue?.toExact(),
    NumberType.FiatTokenQuantity
  )

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
      if (formattedFiatValue && usdValue) {
        return formattedFiatValue
      }
    }
    // Fallback for no formatted value case
    return ''
  }, [
    addFiatSymbolToNumber,
    appFiatCurrency.code,
    appFiatCurrency.symbol,
    currencyInfo,
    formattedCurrencyAmount,
    formattedFiatValue,
    isFiatMode,
    usdValue,
    value,
  ])
}
