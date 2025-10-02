import { Currency, CurrencyAmount, Price, TradeType } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { useEffect, useMemo, useState } from 'react'
import { PositionField } from 'types/position'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useTrade } from 'uniswap/src/features/transactions/swap/hooks/useTrade'

export function useDefaultInitialPrice({
  currencies,
  skip,
}: {
  currencies: {
    [PositionField.TOKEN0]?: Maybe<Currency>
    [PositionField.TOKEN1]?: Maybe<Currency>
  }
  skip?: boolean
}) {
  const [price, setPrice] = useState<Price<Currency, Currency> | undefined>()
  const currencyIn = currencies[PositionField.TOKEN0]
  const currencyOut = currencies[PositionField.TOKEN1]

  const amountSpecified = useMemo(() => {
    if (!currencyIn) {
      return undefined
    }

    return CurrencyAmount.fromRawAmount(currencyIn, JSBI.BigInt(10 ** currencyIn.decimals))
  }, [currencyIn])

  const { trade, isLoading } = useTrade({
    amountSpecified,
    otherCurrency: currencyOut,
    tradeType: TradeType.EXACT_INPUT,
    pollInterval: PollingInterval.Slow,
    skip: !amountSpecified || !currencyOut || !!price || skip,
  })

  // Reset price when currencyIn or currencyOut changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: +currencyIn, +currencyOut
  useEffect(() => {
    setPrice(undefined)
  }, [currencyIn, currencyOut])

  useEffect(() => {
    if (trade?.outputAmount && currencyIn && currencyOut) {
      setPrice(new Price(currencyIn, currencyOut, trade.inputAmount.quotient, trade.outputAmount.quotient))
    }
  }, [trade, currencyIn, currencyOut])

  return { isLoading, price }
}
