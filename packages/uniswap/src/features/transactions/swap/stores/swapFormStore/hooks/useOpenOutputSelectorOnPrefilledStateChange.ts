import { useEffect } from 'react'
import type { SwapFormState } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/types'

export const useOpenOutputSelectorOnPrefilledStateChange = ({
  prefilledSelectingCurrencyField,
  prefilledFilteredChainIds,
  setSwapForm,
}: {
  prefilledSelectingCurrencyField: SwapFormState['selectingCurrencyField']
  prefilledFilteredChainIds: SwapFormState['filteredChainIds'] | undefined
  setSwapForm: (newState: Partial<SwapFormState>) => void
}): void => {
  // Enable launching the output token selector through a change to the prefilled state
  useEffect(() => {
    // Only rerender the swap form value when true, not when false/undefined
    if (prefilledSelectingCurrencyField && prefilledFilteredChainIds) {
      setSwapForm({
        selectingCurrencyField: prefilledSelectingCurrencyField,
        filteredChainIds: prefilledFilteredChainIds,
        isSelectingCurrencyFieldPrefilled: true,
      })
    }
  }, [prefilledSelectingCurrencyField, prefilledFilteredChainIds, setSwapForm])
}
