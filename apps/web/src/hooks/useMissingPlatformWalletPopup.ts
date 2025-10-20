import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { useEffect } from 'react'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useIsMissingPlatformWallet } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsMissingPlatformWallet'
import { useDebounce } from 'utilities/src/time/timing'

const MISSING_PLATFORM_WALLET_POPUP_KEY = 'missing-platform-wallet'

export function useMissingPlatformWalletPopup(expectedPlatform: Platform | undefined): void {
  const isMissingPlatformWallet = useIsMissingPlatformWallet(expectedPlatform)

  // If a user disconnects a wallet with two connectors, connectors are disconnected sequentially
  // isMissingPlatformWallet may be true for a moment before the second disconnect completes
  // Sonnet toasts have trouble handling rapid addPopup/removePopup calls
  // So we debounce the isMissingPlatformWallet state to allow disconnection to finish before triggering the toast to avoid this race condition
  const debouncedIsMissingPlatformWallet = useDebounce(isMissingPlatformWallet, 100)

  useEffect(() => {
    if (debouncedIsMissingPlatformWallet) {
      // Add popup without auto-dismiss (duration: Infinity)
      popupRegistry.addPopup(
        { type: PopupType.MissingPlatformWallet, expectedPlatform },
        MISSING_PLATFORM_WALLET_POPUP_KEY,
        Infinity,
      )
    } else {
      // Remove popup when condition is no longer true
      popupRegistry.removePopup(MISSING_PLATFORM_WALLET_POPUP_KEY)
    }
  }, [expectedPlatform, debouncedIsMissingPlatformWallet])
}
