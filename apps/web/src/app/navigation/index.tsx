import { Outlet } from 'react-router-dom'
import { HomeScreen } from 'src/app/features/home/HomeScreen'
import Locked from 'src/app/features/lockScreen/Locked'
import { DappRequestContent } from 'src/background/features/dappRequests/DappRequestContent'
import { useAppSelector } from 'src/background/store'
import { isOnboardedSelector } from 'src/background/utils/onboardingUtils'
import { YStack } from 'ui'
import { Flex } from 'ui/components/layout/Flex'

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
          {isLoggedIn ? <Outlet /> : <Locked />}
        </Flex>
      </YStack>
    </YStack>
  )
}
