import { useContext } from 'react'
import { SwapAndLimitContext } from '~/features/Swap/state/swap/types'

export function useSwapAndLimitContext() {
  const context = useContext(SwapAndLimitContext)

  return context
}
