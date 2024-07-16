import { PropsWithChildren, useEffect } from 'react'
import { Flex } from 'ui/src'
import { useIsChromeWindowFocusedWithTimeout } from 'uniswap/src/extension/useIsChromeWindowFocused'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { LandingBackground } from 'wallet/src/components/landing/LandingBackground'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'

// The sidebar becomes "inactive"  when this amount of time has passed since the window lost focus.
const INACTIVITY_TIMEOUT = 15 * ONE_MINUTE_MS

export function HideContentsWhenSidebarBecomesInactive({ children }: PropsWithChildren): JSX.Element {
  const isChromeWindowFocused = useIsChromeWindowFocusedWithTimeout(INACTIVITY_TIMEOUT)

  const { navigateToAccountTokenList } = useWalletNavigation()

  useEffect(() => {
    if (!isChromeWindowFocused) {
      // We navigate to the homepage because we'll lose the local state when the sidebar becomes active again,
      // and we want to avoid the user making mistakes because their swap/flow state was lost.
      navigateToAccountTokenList()
    }
  }, [isChromeWindowFocused, navigateToAccountTokenList])

  return isChromeWindowFocused ? (
    <>{children}</>
  ) : (
    <Flex fill>
      <LandingBackground />
    </Flex>
  )
}
