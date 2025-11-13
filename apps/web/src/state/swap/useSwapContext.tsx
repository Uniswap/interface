import { useContext } from 'react'
import { SwapAndLimitContext } from 'state/swap/types'

export function useSwapAndLimitContext() {
  const context = useContext(SwapAndLimitContext)

  return context
}
