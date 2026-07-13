import { Currency, Price } from '@uniswap/sdk-core'
import { useCallback } from 'react'
import { getPrimaryStablecoin } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useUSDCPrice } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'

interface FiatTokenConversion {
  conversionRate: number
  usdPriceOfCurrency: Price<Currency, Currency> | undefined
  fiatToToken: (fiatAmount: string) => string | null
  tokenToFiat: (tokenAmount: string) => string | null
}

export function useFiatTokenConversion({ currency }: { currency: Currency | undefined }): FiatTokenConversion {
  const { convertFiatAmount } = useLocalizationContext()
  const conversionRate = convertFiatAmount(1).amount
  const { price: usdPriceOfCurrency } = useUSDCPrice(currency)

  const fiatToToken = useCallback(
    (fiatAmount: string): string | null => {
      if (!fiatAmount || !usdPriceOfCurrency || !currency) {
        return null
      }
      const parsed = parseFloat(fiatAmount)
      if (!Number.isFinite(parsed) || parsed === 0) {
        return null
      }
      const stablecoin = getPrimaryStablecoin(currency.chainId)
      const usdAmount = (parsed / conversionRate).toFixed(stablecoin.decimals)
      const stablecoinAmount = getCurrencyAmount({
        value: usdAmount,
        valueType: ValueType.Exact,
        currency: stablecoin,
      })
      if (!stablecoinAmount) {
        return null
      }
      const tokenAmount = usdPriceOfCurrency.invert().quote(stablecoinAmount)
      return tokenAmount.toExact()
    },
    [usdPriceOfCurrency, currency, conversionRate],
  )

  const tokenToFiat = useCallback(
    (tokenValue: string): string | null => {
      if (!tokenValue || !usdPriceOfCurrency || !currency) {
        return null
      }
      const tokenAmount = getCurrencyAmount({
        value: tokenValue,
        valueType: ValueType.Exact,
        currency,
      })
      if (!tokenAmount) {
        return null
      }
      const usdAmount = usdPriceOfCurrency.quote(tokenAmount)
      const fiat = parseFloat(usdAmount.toExact()) * conversionRate
      return fiat && Number.isFinite(fiat) ? parseFloat(fiat.toFixed(12)).toString() : null
    },
    [usdPriceOfCurrency, currency, conversionRate],
  )

  return { conversionRate, usdPriceOfCurrency, fiatToToken, tokenToFiat }
}
