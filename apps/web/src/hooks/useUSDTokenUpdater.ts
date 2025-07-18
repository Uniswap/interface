import { Currency } from '@uniswap/sdk-core'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useMemo } from 'react'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { getPrimaryStablecoin } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCPrice } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { NumberType } from 'utilities/src/format/types'

const NUM_DECIMALS_USD = 2
const NUM_DECIMALS_DISPLAY = 2

export function useUSDTokenUpdater({
  isFiatInput,
  exactAmount,
  exactCurrency,
}: {
  isFiatInput: boolean
  exactAmount?: string
  exactCurrency?: Currency
}): {
  formattedAmount?: string
  loading: boolean
} {
  const { price, isLoading } = useUSDCPrice(exactCurrency)
  const { convertFiatAmount, formatCurrencyAmount } = useLocalizationContext()
  const conversionRate = convertFiatAmount(1).amount
  const supportedChainId = useSupportedChainId(exactCurrency?.chainId)

  return useMemo(() => {
    if (!exactCurrency || !price) {
      return { formattedAmount: undefined, loading: isLoading }
    }

    if (isFiatInput) {
      const exactAmountUSD = (parseFloat(exactAmount || '0') / conversionRate).toFixed(NUM_DECIMALS_USD)
      const stablecoinAmount = supportedChainId
        ? tryParseCurrencyAmount(exactAmountUSD, getPrimaryStablecoin(supportedChainId))
        : undefined

      const currencyAmount = stablecoinAmount ? price.invert().quote(stablecoinAmount) : undefined
      const formattedCurrencyAmount = formatCurrencyAmount({
        value: currencyAmount,
        type: NumberType.SwapTradeAmount,
        placeholder: '',
      })

      return { formattedAmount: formattedCurrencyAmount, loading: isLoading }
    }

    const exactCurrencyAmount = tryParseCurrencyAmount(exactAmount || '0', exactCurrency)

    const usdPrice = exactCurrencyAmount ? price.quote(exactCurrencyAmount) : undefined
    const fiatPrice = convertFiatAmount(parseFloat(usdPrice?.toExact() ?? '0')).amount
    const formattedFiatPrice = fiatPrice ? fiatPrice.toFixed(NUM_DECIMALS_DISPLAY) : '0'

    return { formattedAmount: formattedFiatPrice, loading: isLoading }
  }, [
    conversionRate,
    convertFiatAmount,
    exactAmount,
    exactCurrency,
    formatCurrencyAmount,
    isFiatInput,
    price,
    isLoading,
    supportedChainId,
  ])
}
