import { useCallback } from 'react'
import { useSwapAndLimitContext } from '~/features/Swap/state/useSwapContext'

export function useOnSwitchTokens(): () => void {
  const { setCurrencyState } = useSwapAndLimitContext()

  return useCallback(() => {
    setCurrencyState((prev) => ({
      inputCurrency: prev.outputCurrency,
      outputCurrency: prev.inputCurrency,
    }))
  }, [setCurrencyState])
}
