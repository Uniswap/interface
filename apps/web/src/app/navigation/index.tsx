import { useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { HomeScreen } from 'src/app/features/home/HomeScreen'
import Locked from 'src/app/features/lockScreen/Locked'
import { focusOrCreateOnboardingTab } from 'src/app/navigation/utils'
import { DappRequestContent } from 'src/background/features/dappRequests/DappRequestContent'
import { useAppSelector } from 'src/background/store'
import { isOnboardedSelector } from 'src/background/utils/onboardingUtils'
import { YStack } from 'ui/src'
import { Flex } from 'ui/src/components/layout/Flex'

export function MainContent(): JSX.Element {
  const pendingDappRequests = useAppSelector((state) => state.dappRequests.pending)

  const areRequestsPending = pendingDappRequests.length > 0
  const isOnboarded = useAppSelector(isOnboardedSelector)

  if (!isOnboarded) {
    // TODO: add an error state that takes the user to fullscreen onboarding
    throw new Error('you should have onboarded')
  }

  return areRequestsPending ? <DappRequestContent /> : <HomeScreen />
}

const CONTENT_MIN_HEIGHT = 576 // Subtract 2 * $spacing12 from 600 height

export function WebNavigation(): JSX.Element {
  const isLoggedIn = useAppSelector((state) => state.wallet.isUnlocked)

  return (
    <YStack backgroundColor="$background2">
      <YStack
        backgroundColor="$background1"
        borderRadius="$rounded24"
        flex={1}
        height={CONTENT_MIN_HEIGHT}
        margin="$spacing12"
        overflow="hidden"
        width={350}>
        <Flex flex={1} flexGrow={1} overflow="visible">
          {isLoggedIn ? <Outlet /> : <LoggedOut />}
        </Flex>
      </YStack>
    </YStack>
  )
}

function LoggedOut(): JSX.Element {
  const isOnboarded = useAppSelector(isOnboardedSelector)
  const didOpenOnboarding = useRef(false)

  useEffect(() => {
    async function handleOnboarding(): Promise<void> {
      await focusOrCreateOnboardingTab()
      // Automatically close the pop up after focusing on the onboarding tab.
      window.close()
    }

    if (!isOnboarded && !didOpenOnboarding.current) {
      // We keep track of this to avoid opening the onboarding page multiple times if this component remounts.
      didOpenOnboarding.current = true
      handleOnboarding()
    }
  }, [isOnboarded])

  // If the user has not onboarded, we render nothing and let the `useEffect` above automatically close the popup.
  // We could consider showing a loading spinner while the popup is being closed.
  return isOnboarded ? <Locked /> : <></>
}
