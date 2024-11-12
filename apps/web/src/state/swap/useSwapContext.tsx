import { useContext } from 'react'
import { SwapAndLimitContext, SwapContext } from 'state/swap/types'

export function useSwapContext() {
  return useContext(SwapContext)
}

export function useSwapAndLimitContext() {
  const context = useContext(SwapAndLimitContext)

  return context
}
