import { useMemo } from 'react'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'

export const useIsTokenSelectionInvalid = (): boolean => {
  const {
    derivedSwapInfo: { currencies },
  } = useSwapFormContext()

  return useMemo(() => {
    return Object.values(currencies).some((currency) => !currency)
  }, [currencies])
}
