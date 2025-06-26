import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'

export function useSelectedTokenState() {
  const state = useSwapFormContext() // state.input, state.output, etc.
  // decide whether you want the input or the output token:
  return state // or state?.output?.address
}
