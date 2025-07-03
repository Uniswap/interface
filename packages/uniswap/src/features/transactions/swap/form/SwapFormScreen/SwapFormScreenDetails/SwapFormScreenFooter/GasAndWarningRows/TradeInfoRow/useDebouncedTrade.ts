import { useEffect, useState } from 'react'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import type { IndicativeTrade, Trade } from 'uniswap/src/features/transactions/swap/types/trade'

// TODO: WALLL-6294
export function useDebouncedTrade(): Trade | IndicativeTrade | undefined {
  const trade = useSwapFormStoreDerivedSwapInfo((s) => s.trade)
  const [debouncedTrade, setDebouncedTrade] = useState<Trade | IndicativeTrade>()

  useEffect(() => {
    if (trade.trade) {
      setDebouncedTrade(trade.trade)
    } else if (trade.indicativeTrade) {
      setDebouncedTrade(trade.indicativeTrade)
    } else if (!trade.isLoading) {
      setDebouncedTrade(undefined)
    }
  }, [trade.indicativeTrade, trade.isLoading, trade.trade])

  return debouncedTrade
}
