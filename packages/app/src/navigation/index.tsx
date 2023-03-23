import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { HomeScreen } from '../features/home/HomeScreen'
import { IntroScreen } from '../features/onboarding/IntroScreen'
import { AppStackParamList, OnboardingStackParamList } from './types'
import { OnboardingScreen, Screen } from './screens'
import { useSagaStatus } from '../state/useSagaStatus'
import { authSagaName } from '../features/auth/saga'
import { SagaStatus } from '../utils/saga'
import Locked from '../features/auth/Locked'

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

  // TODO: check if they are onboarded. if not then show the pw lock screen
  return <Locked />

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
