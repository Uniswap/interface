import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Locked from '../features/auth/Locked'
import { authSagaName } from '../features/auth/saga'
import { DappRequestContent } from '../features/dappRequests/DappRequestContent'
import { HomeScreen } from '../features/home/HomeScreen'
import { IntroScreen } from '../features/onboarding/IntroScreen'
import { isOnboardedSelector } from '../features/wallet/selectors'
import { useAppSelector } from '../state'
import { useSagaStatus } from '../state/useSagaStatus'
import { SagaStatus } from '../utils/saga'
import { OnboardingScreen, Screen } from './screens'
import {
  AppStackParamList,
  DappRequestsStackParamList,
  OnboardingStackParamList,
} from './types'

const AppStack = createNativeStackNavigator<AppStackParamList>()
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>()
const DappRequestStack =
  createNativeStackNavigator<DappRequestsStackParamList>()

export function WebNavigation(): JSX.Element {
  const pendingDappRequests = useAppSelector(
    (state) => state.dappRequests.pending
  )
  const isLoggedIn =
    useSagaStatus(authSagaName, undefined, false).status === SagaStatus.Success

  const areRequestsPending = pendingDappRequests.length > 0
  const isOnboarded = useAppSelector(isOnboardedSelector)

  if (!isOnboarded) {
    return (
      <OnboardingStack.Navigator>
        <OnboardingStack.Screen
          component={IntroScreen}
          name={OnboardingScreen.Landing}
        />
        <OnboardingStack.Screen
          component={IntroScreen}
          name={OnboardingScreen.Backup}
        />
        <OnboardingStack.Screen
          component={IntroScreen}
          name={OnboardingScreen.Outro}
        />
        <OnboardingStack.Screen
          component={IntroScreen}
          name={OnboardingScreen.Security}
        />
      </OnboardingStack.Navigator>
    )
  }

  if (isLoggedIn) {
    if (areRequestsPending) {
      return (
        <DappRequestStack.Navigator>
          <DappRequestStack.Screen
            component={DappRequestContent}
            name={Screen.DappRequests}
          />
        </DappRequestStack.Navigator>
      )
    }
    return (
      <AppStack.Navigator>
        <AppStack.Screen component={HomeScreen} name={Screen.Home} />
      </AppStack.Navigator>
    )
  }

  return <Locked />
}
