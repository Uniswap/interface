import { Currency } from '@uniswap/sdk-core'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useMemo } from 'react'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { asSupportedChain } from 'constants/chains'
import useStablecoinPrice, { STABLECOIN_AMOUNT_OUT } from './useStablecoinPrice'

const NUM_DECIMALS_USD = 2
const NUM_DECIMALS_DISPLAY = 2

export function useUSDTokenUpdater(isFiatInput: boolean, exactAmount: string, exactCurrency?: Currency) {
  const price = useStablecoinPrice(exactCurrency)
  const { convertToFiatAmount, formatCurrencyAmount } = useFormatter()
  const conversionRate = convertToFiatAmount().amount

  return useMemo(() => {
    if (!exactCurrency || !price) {
      return
    }

    if (isFiatInput) {
      const exactAmountUSD = (parseFloat(exactAmount || '0') / conversionRate).toFixed(NUM_DECIMALS_USD)
      const supportedChainId = asSupportedChain(exactCurrency.chainId)
      const stablecoinAmount = supportedChainId
        ? tryParseCurrencyAmount(exactAmountUSD, STABLECOIN_AMOUNT_OUT[supportedChainId].currency)
        : undefined

      const currencyAmount = stablecoinAmount ? price?.invert().quote(stablecoinAmount) : undefined
      const formattedCurrencyAmount = formatCurrencyAmount({
        amount: currencyAmount,
        type: NumberType.SwapTradeAmount,
        placeholder: '',
      })

      return formattedCurrencyAmount
    }

    const exactCurrencyAmount = tryParseCurrencyAmount(exactAmount || '0', exactCurrency)

    const usdPrice = exactCurrencyAmount ? price?.quote(exactCurrencyAmount) : undefined
    const fiatPrice = convertToFiatAmount(parseFloat(usdPrice?.toExact() ?? '0')).amount
    const formattedFiatPrice = fiatPrice ? fiatPrice.toFixed(NUM_DECIMALS_DISPLAY) : '0'

    return formattedFiatPrice
  }, [conversionRate, convertToFiatAmount, exactAmount, exactCurrency, formatCurrencyAmount, isFiatInput, price])
}
