import { useAccountsStore } from 'uniswap/src/features/accounts/store/hooks'
import { FlexiblePlatformInput } from 'uniswap/src/features/accounts/store/utils/flexibleInput'

export function useIsMissingPlatformWallet(expectedFlexiblePlatform: FlexiblePlatformInput | undefined): boolean {
  return useAccountsStore((s) => {
    if (!expectedFlexiblePlatform) {
      return false
    }

    return Boolean(s.getConnectionStatus().isConnected && !s.getConnectionStatus(expectedFlexiblePlatform).isConnected)
  })
}
