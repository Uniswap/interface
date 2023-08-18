import { useCallback, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { HomeScreen } from 'src/app/features/home/HomeScreen'
import { Locked } from 'src/app/features/lockScreen/Locked'
import { focusOrCreateOnboardingTab } from 'src/app/navigation/utils'
import { DappRequestContent } from 'src/background/features/dappRequests/DappRequestContent'
import { useAppDispatch, useAppSelector } from 'src/background/store'
import { isOnboardedSelector } from 'src/background/utils/onboardingUtils'
import { Flex, YStack } from 'ui/src'
import { useAsyncData } from 'utilities/src/react/hooks'

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

export function WebNavigation(): JSX.Element {
  const isLoggedIn = useAppSelector((state) => state.wallet.isUnlocked)

  return (
    <YStack backgroundColor="$surface1" flex={1} minHeight="100vh">
      <Flex flex={1} flexGrow={1} overflow="visible">
        {isLoggedIn ? <Outlet /> : <LoggedOut />}
      </Flex>
    </YStack>
  )
}

function LoggedOut(): JSX.Element {
  const isOnboarded = useAppSelector(isOnboardedSelector)
  const didOpenOnboarding = useRef(false)
  const dispatch = useAppDispatch()

  const handleOnboarding = useCallback(async () => {
    if (!isOnboarded && !didOpenOnboarding.current) {
      // We keep track of this to avoid opening the onboarding page multiple times if this component remounts.
      didOpenOnboarding.current = true
      await focusOrCreateOnboardingTab({ dispatch })
      // Automatically close the pop up after focusing on the onboarding tab.
      window.close()
    }
  }, [dispatch, isOnboarded])

  useAsyncData(handleOnboarding)

  // If the user has not onboarded, we render nothing and let the `useEffect` above automatically close the popup.
  // We could consider showing a loading spinner while the popup is being closed.
  return isOnboarded ? <Locked /> : <></>
}
