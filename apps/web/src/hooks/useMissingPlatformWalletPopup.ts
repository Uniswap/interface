import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { useEffect } from 'react'
import { useIsMissingPlatformWallet } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsMissingPlatformWallet'

const MISSING_PLATFORM_WALLET_POPUP_KEY = 'missing-platform-wallet'

export function useMissingPlatformWalletPopup(): void {
  const { isMissingPlatformWallet, expectedPlatform } = useIsMissingPlatformWallet()

  useEffect(() => {
    if (isMissingPlatformWallet) {
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
  }, [expectedPlatform, isMissingPlatformWallet])
}
