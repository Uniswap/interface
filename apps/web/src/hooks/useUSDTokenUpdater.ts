import { Currency } from '@uniswap/sdk-core'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useMemo } from 'react'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { useUSDCPrice } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const NUM_DECIMALS_USD = 2
const NUM_DECIMALS_DISPLAY = 2

export function useUSDTokenUpdater(
  isFiatInput: boolean,
  exactAmount: string,
  exactCurrency?: Currency,
): {
  formattedAmount?: string
  loading: boolean
} {
  const { price, isLoading } = useUSDCPrice(exactCurrency)
  const { convertToFiatAmount, formatCurrencyAmount } = useFormatter()
  const conversionRate = convertToFiatAmount(1).amount
  const supportedChainId = useSupportedChainId(exactCurrency?.chainId)

  return useMemo(() => {
    if (!exactCurrency || !price) {
      return { formattedAmount: undefined, loading: isLoading }
    }

    if (isFiatInput) {
      const exactAmountUSD = (parseFloat(exactAmount || '0') / conversionRate).toFixed(NUM_DECIMALS_USD)
      const stablecoinAmount = supportedChainId
        ? tryParseCurrencyAmount(exactAmountUSD, getChainInfo(supportedChainId).spotPriceStablecoinAmount.currency)
        : undefined

      const currencyAmount = stablecoinAmount ? price?.invert().quote(stablecoinAmount) : undefined
      const formattedCurrencyAmount = formatCurrencyAmount({
        amount: currencyAmount,
        type: NumberType.SwapTradeAmount,
        placeholder: '',
      })

      return { formattedAmount: formattedCurrencyAmount, loading: isLoading }
    }

    const exactCurrencyAmount = tryParseCurrencyAmount(exactAmount || '0', exactCurrency)

    const usdPrice = exactCurrencyAmount ? price?.quote(exactCurrencyAmount) : undefined
    const fiatPrice = convertToFiatAmount(parseFloat(usdPrice?.toExact() ?? '0')).amount
    const formattedFiatPrice = fiatPrice ? fiatPrice.toFixed(NUM_DECIMALS_DISPLAY) : '0'

    return { formattedAmount: formattedFiatPrice, loading: isLoading }
  }, [
    conversionRate,
    convertToFiatAmount,
    exactAmount,
    exactCurrency,
    formatCurrencyAmount,
    isFiatInput,
    price,
    isLoading,
    supportedChainId,
  ])
}
