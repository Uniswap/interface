import { useEffect } from 'react'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { CurrencyField } from 'uniswap/src/types/currency'

export const useUpdateSwapFormOnMountIfExactOutputWillFail = (exactOutputWillFail: boolean): void => {
  const updateSwapForm = useSwapFormStore((s) => s.updateSwapForm)

  useEffect(() => {
    if (exactOutputWillFail) {
      updateSwapForm({
        exactCurrencyField: CurrencyField.INPUT,
        focusOnCurrencyField: CurrencyField.INPUT,
      })
    }
    // Since we only want to run this on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
