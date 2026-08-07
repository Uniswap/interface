import { useEffect, useRef } from 'react'
import { areCurrencyIdsEqual } from 'uniswap/src/utils/currencyId'

export function useResetEarnAmountsOnDepositSourceChange(
  selectedDepositSourceCurrencyId: string | undefined,
  resetAmounts: () => void,
): void {
  const previousDepositSourceCurrencyIdRef = useRef<string | undefined>(undefined)

  // The first source arrives asynchronously and must retain any amount supplied by navigation.
  // Later source changes return from the selector without remounting this screen, so clear any
  // amount (including the exact Max value) that was calculated from the previous balance.
  useEffect(() => {
    if (selectedDepositSourceCurrencyId === undefined) {
      return
    }

    const previousCurrencyId = previousDepositSourceCurrencyIdRef.current
    previousDepositSourceCurrencyIdRef.current = selectedDepositSourceCurrencyId

    if (previousCurrencyId !== undefined && !areCurrencyIdsEqual(previousCurrencyId, selectedDepositSourceCurrencyId)) {
      resetAmounts()
    }
  }, [resetAmounts, selectedDepositSourceCurrencyId])
}
