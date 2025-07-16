import { useCallback } from 'react'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'

export const useHideTokenSelector = (): (() => void) => {
  const { updateSwapForm, isSelectingCurrencyFieldPrefilled } = useSwapFormContext()
  const { setIsSwapTokenSelectorOpen } = useUniswapContext()

  return useCallback(() => {
    updateSwapForm({
      selectingCurrencyField: undefined,
      isSelectingCurrencyFieldPrefilled: false,
      // reset the filtered chain ids when coming back in from a prefill so it's not persisted forever
      ...(isSelectingCurrencyFieldPrefilled ? { filteredChainIds: {} } : {}),
    })
    setIsSwapTokenSelectorOpen(false) // resets force flag for web on close as cleanup
  }, [isSelectingCurrencyFieldPrefilled, setIsSwapTokenSelectorOpen, updateSwapForm])
}
