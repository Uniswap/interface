import { createContext, useContext } from 'react'
import type { SwapFlowTimer } from 'uniswap/src/features/transactions/swap/utils/SwapFlowTimer'

export const SwapFlowTimerContext = createContext<SwapFlowTimer | null>(null)

export function useSwapFlowTimer(): SwapFlowTimer | null {
  return useContext(SwapFlowTimerContext)
}
