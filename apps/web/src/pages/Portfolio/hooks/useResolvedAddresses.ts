import { useMemo } from 'react'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useActiveAddresses } from '~/features/accounts/store/hooks'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'

/**
 * Resolves portfolio addresses based on whether viewing an external wallet or connected wallet.
 * Does NOT fall back to demo wallet - returns undefined if no addresses available.
 * Use usePortfolioAddresses if you need the demo wallet fallback.
 */
export function useResolvedAddresses(): {
  evmAddress: Address | undefined
  svmAddress: Address | undefined
  isExternalWallet: boolean
} {
  const activeAddresses = useActiveAddresses()
  const { externalAddress, isExternalWallet } = usePortfolioRoutes()

  return useMemo(() => {
    // If viewing an external wallet, return that address based on its type
    if (isExternalWallet && externalAddress) {
      return {
        evmAddress: externalAddress.platform === Platform.EVM ? externalAddress.address : undefined,
        svmAddress: externalAddress.platform === Platform.SVM ? externalAddress.address : undefined,
        isExternalWallet: true,
      }
    }

    // Otherwise return connected addresses (may be undefined)
    return {
      ...activeAddresses,
      isExternalWallet: false,
    }
  }, [activeAddresses, externalAddress, isExternalWallet])
}
