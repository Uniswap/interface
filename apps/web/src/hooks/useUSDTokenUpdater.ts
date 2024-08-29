import { Currency } from '@uniswap/sdk-core'
import { getChain, useSupportedChainId } from 'constants/chains'
import useStablecoinPrice from 'hooks/useStablecoinPrice'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useMemo } from 'react'
import { TradeState } from 'state/routing/types'
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
  const { price, state } = useStablecoinPrice(exactCurrency)
  const { convertToFiatAmount, formatCurrencyAmount } = useFormatter()
  const conversionRate = convertToFiatAmount().amount
  const supportedChainId = useSupportedChainId(exactCurrency?.chainId)

  return useMemo(() => {
    if (!exactCurrency || !price) {
      return { formattedAmount: undefined, loading: state === TradeState.LOADING }
    }

    if (isFiatInput) {
      const exactAmountUSD = (parseFloat(exactAmount || '0') / conversionRate).toFixed(NUM_DECIMALS_USD)
      const stablecoinAmount = supportedChainId
        ? tryParseCurrencyAmount(
            exactAmountUSD,
            getChain({ chainId: supportedChainId }).spotPriceStablecoinAmount.currency,
          )
        : undefined

      const currencyAmount = stablecoinAmount ? price?.invert().quote(stablecoinAmount) : undefined
      const formattedCurrencyAmount = formatCurrencyAmount({
        amount: currencyAmount,
        type: NumberType.SwapTradeAmount,
        placeholder: '',
      })

      return { formattedAmount: formattedCurrencyAmount, loading: state === TradeState.LOADING }
    }

    const exactCurrencyAmount = tryParseCurrencyAmount(exactAmount || '0', exactCurrency)

    const usdPrice = exactCurrencyAmount ? price?.quote(exactCurrencyAmount) : undefined
    const fiatPrice = convertToFiatAmount(parseFloat(usdPrice?.toExact() ?? '0')).amount
    const formattedFiatPrice = fiatPrice ? fiatPrice.toFixed(NUM_DECIMALS_DISPLAY) : '0'

    return { formattedAmount: formattedFiatPrice, loading: state === TradeState.LOADING }
  }, [
    conversionRate,
    convertToFiatAmount,
    exactAmount,
    exactCurrency,
    formatCurrencyAmount,
    isFiatInput,
    price,
    state,
    supportedChainId,
  ])
}
