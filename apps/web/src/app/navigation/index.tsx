import Locked from 'src/features/auth/Locked'
import { HomeScreen } from 'src/features/home/HomeScreen'
import { YStack } from 'ui/src'
import { Flex } from 'ui/src/components/layout/Flex'
import { authSagaName } from 'wallet/src/features/auth/saga'
import { isOnboardedSelector } from 'wallet/src/features/wallet/selectors'
import { useSagaStatus } from 'wallet/src/state/useSagaStatus'
import { SagaStatus } from 'wallet/src/utils/saga'
import { useAppSelector } from '../../background/store'
import { DappRequestContent } from '../../features/dappRequests/DappRequestContent'

function WebNavigationInner(): JSX.Element {
  const pendingDappRequests = useAppSelector((state) => state.dappRequests.pending)
  const isLoggedIn = useSagaStatus(authSagaName, undefined, false).status === SagaStatus.Success

  const areRequestsPending = pendingDappRequests.length > 0
  const isOnboarded = useAppSelector(isOnboardedSelector)

  if (!isOnboarded) {
    // TODO: add an error state that takes the user to fullscreen onboarding
    throw new Error('you should have onboarded')
  }

  if (!isLoggedIn) {
    return <Locked />
  }

  return areRequestsPending ? <DappRequestContent /> : <HomeScreen />
}

const CONTENT_MIN_HEIGHT = 576 // Subtract 2 * $spacing12 from 600 height

export function WebNavigation(): JSX.Element {
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
          <WebNavigationInner />
        </Flex>
      </YStack>
    </YStack>
  )
}
