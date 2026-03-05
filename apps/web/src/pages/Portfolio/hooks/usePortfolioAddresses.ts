import { useMemo } from 'react'
import { useResolvedAddresses } from '~/pages/Portfolio/hooks/useResolvedAddresses'

// This is the address used for the disconnected demo view. It is only used in the disconnected state for the portfolio page.
const DEMO_WALLET_ADDRESS = '0x8796207d877194d97a2c360c041f13887896FC79'

/**
 * Returns portfolio addresses with demo wallet fallback for disconnected state.
 * Use useResolvedAddresses if you don't want the demo wallet fallback.
 */
export function usePortfolioAddresses(): {
  evmAddress: Address | undefined
  svmAddress: Address | undefined
  isExternalWallet: boolean
} {
  const resolved = useResolvedAddresses()

  return useMemo(() => {
    // If we have resolved addresses (external or connected), return them
    if (resolved.evmAddress || resolved.svmAddress) {
      return resolved
    }

    // If not connected and not viewing external wallet, return demo address
    return {
      evmAddress: DEMO_WALLET_ADDRESS,
      svmAddress: undefined,
      isExternalWallet: false,
    }
  }, [resolved])
}
