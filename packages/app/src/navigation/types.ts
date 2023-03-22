import { OnboardingScreen, Screen } from "./screens"

export type AppStackParamList = {
  [Screen.Home]: undefined
}

export type OnboardingStackParamList = {
  [OnboardingScreen.Backup]: undefined,
  [OnboardingScreen.Landing]: undefined,
  [OnboardingScreen.Outro]: undefined,
  [OnboardingScreen.Security]: undefined
}