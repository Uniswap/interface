import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useEvent } from 'utilities/src/react/hooks'

export const useHideTokenSelector = (): (() => void) => {
  const { updateSwapForm, isSelectingCurrencyFieldPrefilled } = useSwapFormStore((s) => ({
    updateSwapForm: s.updateSwapForm,
    isSelectingCurrencyFieldPrefilled: s.isSelectingCurrencyFieldPrefilled,
  }))
  const { setIsSwapTokenSelectorOpen } = useUniswapContext()

  return useEvent(() => {
    updateSwapForm({
      selectingCurrencyField: undefined,
      isSelectingCurrencyFieldPrefilled: false,
      // reset the filtered chain ids when coming back in from a prefill so it's not persisted forever
      ...(isSelectingCurrencyFieldPrefilled ? { filteredChainIds: {} } : {}),
    })
    setIsSwapTokenSelectorOpen(false) // resets force flag for web on close as cleanup
  })
}
