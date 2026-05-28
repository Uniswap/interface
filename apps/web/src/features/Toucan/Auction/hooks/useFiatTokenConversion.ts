import { Currency, Price } from '@uniswap/sdk-core'
import { useCallback } from 'react'
import { getPrimaryStablecoin } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useUSDCPrice } from 'uniswap/src/features/transactions/hooks/useUSDCPriceWrapper'

interface UseFiatTokenConversionParams {
  bidCurrency: Currency | undefined
}

interface FiatTokenConversion {
  conversionRate: number
  usdPriceOfCurrency: Price<Currency, Currency> | undefined
  fiatToBidToken: (fiatAmount: string) => string | null
  bidTokenToFiat: (tokenAmount: string) => string | null
}

export function useFiatTokenConversion({ bidCurrency }: UseFiatTokenConversionParams): FiatTokenConversion {
  const { convertFiatAmount } = useLocalizationContext()
  const conversionRate = convertFiatAmount(1).amount
  const { price: usdPriceOfCurrency } = useUSDCPrice(bidCurrency)

  const fiatToBidToken = useCallback(
    (fiatAmount: string): string | null => {
      if (!fiatAmount || !usdPriceOfCurrency || !bidCurrency) {
        return null
      }
      const parsed = parseFloat(fiatAmount)
      if (!Number.isFinite(parsed) || parsed === 0) {
        return null
      }
      const chainId = bidCurrency.chainId
      const stablecoin = getPrimaryStablecoin(chainId)
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
    [usdPriceOfCurrency, bidCurrency, conversionRate],
  )

  const bidTokenToFiat = useCallback(
    (tokenValue: string): string | null => {
      if (!tokenValue || !usdPriceOfCurrency || !bidCurrency) {
        return null
      }
      const tokenAmount = getCurrencyAmount({
        value: tokenValue,
        valueType: ValueType.Exact,
        currency: bidCurrency,
      })
      if (!tokenAmount) {
        return null
      }
      const usdAmount = usdPriceOfCurrency.quote(tokenAmount)
      const fiat = parseFloat(usdAmount.toExact()) * conversionRate
      return fiat && Number.isFinite(fiat) ? parseFloat(fiat.toFixed(12)).toString() : null
    },
    [usdPriceOfCurrency, bidCurrency, conversionRate],
  )

  return { conversionRate, usdPriceOfCurrency, fiatToBidToken, bidTokenToFiat }
}
