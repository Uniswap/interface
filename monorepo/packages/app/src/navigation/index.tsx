import { Flex } from 'ui/src/components/layout/Flex'
import Locked from '../features/auth/Locked'
import { authSagaName } from '../features/auth/saga'
import { DappRequestContent } from '../features/dappRequests/DappRequestContent'
import { HomeScreen } from '../features/home/HomeScreen'
import { isOnboardedSelector } from '../features/wallet/selectors'
import { useAppSelector } from '../state'
import { useSagaStatus } from '../state/useSagaStatus'
import { SagaStatus } from '../utils/saga'

function WebNavigationInner(): JSX.Element {
  const pendingDappRequests = useAppSelector(
    (state) => state.dappRequests.pending
  )
  const isLoggedIn =
    useSagaStatus(authSagaName, undefined, false).status === SagaStatus.Success

  const areRequestsPending = pendingDappRequests.length > 0
  const isOnboarded = useAppSelector(isOnboardedSelector)

  if (!isOnboarded) {
        // TODO: add an error state that takes the user to fullscreen onboarding
        throw new Error('you should have onboarded')
  }

  if (isLoggedIn) {
    return <Locked />
  }

  return areRequestsPending ? <DappRequestContent /> : <HomeScreen />
}

export function WebNavigation(): JSX.Element {
  return (
    <Flex flex={1} maxHeight={600} overflow="visible" width={350}>
      <WebNavigationInner />
    </Flex>
  )
}
