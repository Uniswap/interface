import { useMemo } from 'react'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'

export const useIsTokenSelectionInvalid = (): boolean => {
  const currencies = useSwapFormStoreDerivedSwapInfo((s) => s.currencies)

  return useMemo(() => {
    return Object.values(currencies).some((currency) => !currency)
  }, [currencies])
}
