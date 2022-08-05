import { Currency, CurrencyAmount, TradeType } from '@kyberswap/ks-sdk-core'
import { Trade } from '@kyberswap/ks-sdk-elastic'

import { TradeState } from 'state/routing/types'

import useDebounce from './useDebounce'
import { useProAmmClientSideTrade } from './useProAmmClientSideTrade'

export function useProAmmBestTrade(
  tradeType: TradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency,
): {
  state: TradeState
  trade: Trade<Currency, Currency, TradeType> | undefined
} {
  const [debouncedAmount, debouncedOtherCurrency] = useDebounce([amountSpecified, otherCurrency], 800)
  const isLoading = amountSpecified !== undefined && debouncedAmount === undefined
  const bestTrade = useProAmmClientSideTrade(tradeType, debouncedAmount, debouncedOtherCurrency)
  return {
    ...bestTrade,
    ...(isLoading ? { state: TradeState.LOADING } : {}),
  }
}
