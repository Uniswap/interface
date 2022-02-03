import { useMemo } from 'react'
import { useActiveWeb3React } from '.'

export function useGasInfo(): { loading: boolean; gas: { fast: number; normal: number; slow: number } } {
  const { chainId } = useActiveWeb3React()

  return useMemo(() => {
    // if (loadingNativeCurrencyUSDPrice) return { loading: true, gasFeesUSD: [] }
    if (!chainId) {
      return { loading: false, gas: { normal: 0, fast: 0, slow: 0 } }
    } else {
      return {
        loading: false,
        gas: { normal: 22, fast: 33, slow: 44 }
      }
    }
  }, [chainId])
}
