import { Currency } from '@uniswap/sdk-core'
import React, { useEffect, useRef } from 'react'
import { AnyAction } from 'redux'
import { NumberType } from 'utilities/src/format/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import {
  STABLECOIN_AMOUNT_OUT,
  useUSDCPrice,
} from 'wallet/src/features/transactions/swap/trade/hooks/useUSDCPrice'
import {
  updateExactAmountFiat,
  updateExactAmountToken,
} from 'wallet/src/features/transactions/transactionState/transactionState'
import { ValueType, getCurrencyAmount } from 'wallet/src/utils/getCurrencyAmount'

const NUM_DECIMALS_USD = 2
const NUM_DECIMALS_DISPLAY = 2

export function useUSDTokenUpdater(
  dispatch: React.Dispatch<AnyAction>,
  isFiatInput: boolean,
  exactAmountToken: string,
  exactAmountFiat: string,
  exactCurrency?: Currency
): void {
  const price = useUSDCPrice(exactCurrency)
  const shouldUseUSDRef = useRef(isFiatInput)
  const { convertFiatAmount, formatCurrencyAmount } = useLocalizationContext()
  const conversionRate = convertFiatAmount().amount

  useEffect(() => {
    shouldUseUSDRef.current = isFiatInput
  }, [isFiatInput])

  useEffect(() => {
    if (!exactCurrency || !price) {
      return
    }

    const exactAmountUSD = (parseFloat(exactAmountFiat) / conversionRate).toFixed(NUM_DECIMALS_USD)

    if (shouldUseUSDRef.current) {
      const stablecoinAmount = getCurrencyAmount({
        value: exactAmountUSD,
        valueType: ValueType.Exact,
        currency: STABLECOIN_AMOUNT_OUT[exactCurrency.chainId]?.currency,
      })

      const currencyAmount = stablecoinAmount ? price?.invert().quote(stablecoinAmount) : undefined

      return dispatch(
        updateExactAmountToken({
          amount: formatCurrencyAmount({
            value: currencyAmount,
            type: NumberType.SwapTradeAmount,
            placeholder: '',
          }),
        })
      )
    }

    const exactCurrencyAmount = getCurrencyAmount({
      value: exactAmountToken,
      valueType: ValueType.Exact,
      currency: exactCurrency,
    })
    const usdPrice = exactCurrencyAmount ? price?.quote(exactCurrencyAmount) : undefined
    const fiatPrice = parseFloat(usdPrice?.toExact() ?? '0') * conversionRate

    return dispatch(
      updateExactAmountFiat({ amount: fiatPrice ? fiatPrice.toFixed(NUM_DECIMALS_DISPLAY) : '0' })
    )
  }, [
    dispatch,
    shouldUseUSDRef,
    exactAmountFiat,
    exactAmountToken,
    exactCurrency,
    price,
    conversionRate,
    formatCurrencyAmount,
  ])
}
