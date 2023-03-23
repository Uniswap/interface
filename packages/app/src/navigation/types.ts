import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { OnboardingScreen, Screen } from './screens'

export type AppStackParamList = {
  [Screen.Home]: undefined
}

export type AppStackNavigationProp =
  NativeStackNavigationProp<AppStackParamList>

export type OnboardingStackParamList = {
  [OnboardingScreen.Backup]: undefined
  [OnboardingScreen.Landing]: undefined
  [OnboardingScreen.Outro]: undefined
  [OnboardingScreen.Security]: undefined
}
export type OnboardingStackNavigationProp =
  NativeStackNavigationProp<OnboardingStackParamList>

export const useAppNavigation = useNavigation<AppStackNavigationProp>
export const useOnboardingNavigation =
  useNavigation<OnboardingStackNavigationProp>
