import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import type { TradeWithStatus } from 'uniswap/src/features/transactions/swap/types/trade'

const getIsIndicative = (trade: TradeWithStatus): boolean => {
  return !trade.trade && Boolean(trade.indicativeTrade || trade.isIndicativeLoading)
}

export const useIsTradeIndicative = (): boolean => {
  const trade = useSwapFormStoreDerivedSwapInfo((s) => s.trade)

  return getIsIndicative(trade)
}
