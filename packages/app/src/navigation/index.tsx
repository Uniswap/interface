import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { authSagaName } from '../features/auth/saga'
import { HomeScreen } from '../features/home/HomeScreen'
import { IntroScreen } from '../features/onboarding/IntroScreen'
import { useSagaStatus } from '../state/useSagaStatus'
import { SagaStatus } from '../utils/saga'
import { OnboardingScreen, Screen } from './screens'
import { AppStackParamList, OnboardingStackParamList } from './types'

const AppStack = createNativeStackNavigator<AppStackParamList>()
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>()

export function WebNavigation(): JSX.Element {
  const isLoggedIn =
    useSagaStatus(authSagaName, undefined, false).status === SagaStatus.Success

  if (isLoggedIn) {
    return (
      <AppStack.Navigator>
        <AppStack.Screen component={HomeScreen} name={Screen.Home} />
      </AppStack.Navigator>
    )
  }

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
