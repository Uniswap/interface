import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'

import type { TradeWithStatus } from 'uniswap/src/features/transactions/swap/types/trade'

const getIsIndicative = (trade: TradeWithStatus): boolean => {
  return !trade.trade && Boolean(trade.indicativeTrade || trade.isIndicativeLoading)
}

export const useIsTradeIndicative = (): boolean => {
  const {
    derivedSwapInfo: { trade },
  } = useSwapFormContext()

  return getIsIndicative(trade)
}
