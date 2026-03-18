import { useCallback, useEffect, useState } from 'react'
import { GasFeeData } from 'wallet/src/features/smartWallet/utils/gasFeeUtils'

/**
 * This hook calculates the total fiat value of gas fees across multiple chains.
 * Each chain's gas fee is converted to fiat individually, then summed together.
 * This is different from converting a single total gas amount to fiat.
 */
interface UseFiatGasFeesReturnType {
  totalFiatAmount: number
  isLoading: boolean
  hasError: boolean
  fiatFees: Record<number, number | null>
  onFetched: (chainId: number, fiatAmount: number) => void
  onError: (error: boolean) => void
}

export function useFiatGasFees(gasFees: GasFeeData[]): UseFiatGasFeesReturnType {
  const [fiatFees, setFiatFees] = useState<Record<number, number | null>>({})
  const [hasError, setHasError] = useState(false)

  const resetState = useCallback(() => {
    setFiatFees({})
    setHasError(false)
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: -gasFees
  useEffect(() => {
    resetState()
  }, [gasFees, resetState])

  const onFetched = useCallback((chainId: number, fiatAmount: number): void => {
    setFiatFees((prev) => ({ ...prev, [chainId]: fiatAmount }))
  }, [])

  const onError = useCallback((error: boolean): void => {
    if (error) {
      setHasError(true)
    }
  }, [])

  const totalFiatAmount = Object.values(fiatFees).reduce((sum, fee) => (sum ?? 0) + (fee ?? 0), 0)

  const allFeesLoaded = Object.keys(fiatFees).length === gasFees.length
  const isLoading = !allFeesLoaded && !hasError

  return {
    totalFiatAmount: totalFiatAmount as number,
    isLoading,
    hasError,
    fiatFees,
    onFetched,
    onError,
  }
}
