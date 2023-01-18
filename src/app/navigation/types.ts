import {
  CompositeNavigationProp,
  CompositeScreenProps,
  NavigatorScreenParams,
  useNavigation,
} from '@react-navigation/native'
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'
import { EducationContentType } from 'src/components/education'
import { ImportType, OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { OnboardingScreens, Screens, Tabs } from 'src/screens/Screens'

type NFTItem = { owner: Address; address: string; tokenId: string }

export type TabParamList = {
  [Tabs.Home]: undefined
  [Tabs.Explore]: undefined | { screen: Screens; params: { address: string } }
  [Tabs.SwapButton]: undefined
}

export type HomeStackParamList = {
  [Screens.Home]: undefined
}

export type ExploreStackParamList = {
  [Screens.Explore]: undefined
}

export type AccountStackParamList = {
  [Screens.Accounts]: undefined
}

export type SettingsStackParamList = {
  [Screens.Settings]: undefined
  [Screens.SettingsWallet]: { address: Address }
  [Screens.SettingsWalletEdit]: { address: Address }
  [Screens.SettingsWalletManageConnection]: { address: Address }
  [Screens.SettingsHelpCenter]: undefined
  [Screens.SettingsChains]: undefined
  [Screens.SettingsTestConfigs]: undefined
  [Screens.SettingsBiometricAuth]: undefined
  [Screens.WebView]: { headerTitle: string; uriLink: string }
  [Screens.Dev]: undefined
  [Screens.SettingsCloudBackupScreen]: { address: Address }
  [Screens.SettingsCloudBackupStatus]: { address: Address }
  [Screens.SettingsViewSeedPhrase]: { address: Address }
  [OnboardingScreens.Landing]: undefined // temporary to be able to view onboarding from settings
}

export type OnboardingStackBaseParams =
  | {
      importType?: ImportType
      entryPoint?: OnboardingEntryPoint
    }
  | undefined

export type OnboardingStackParamList = {
  [OnboardingScreens.BackupCloudProcessing]: {
    password: string
  } & OnboardingStackBaseParams
  [OnboardingScreens.BackupManual]: OnboardingStackBaseParams
  [OnboardingScreens.BackupCloudPassword]: OnboardingStackBaseParams
  [OnboardingScreens.Backup]: OnboardingStackBaseParams
  [OnboardingScreens.Landing]: OnboardingStackBaseParams
  [OnboardingScreens.EditName]: OnboardingStackBaseParams
  [OnboardingScreens.SelectColor]: OnboardingStackBaseParams
  [OnboardingScreens.Notifications]: OnboardingStackBaseParams
  [OnboardingScreens.Outro]: OnboardingStackBaseParams
  [OnboardingScreens.Security]: OnboardingStackBaseParams

  // import
  [OnboardingScreens.ImportMethod]: OnboardingStackBaseParams
  [OnboardingScreens.RestoreCloudBackupLoading]: OnboardingStackBaseParams
  [OnboardingScreens.RestoreCloudBackup]: OnboardingStackBaseParams
  [OnboardingScreens.RestoreCloudBackupPassword]: {
    mnemonicId: string
  } & OnboardingStackBaseParams
  [OnboardingScreens.SeedPhraseInput]: OnboardingStackBaseParams
  [OnboardingScreens.SelectWallet]: OnboardingStackBaseParams
  [OnboardingScreens.WatchWallet]: OnboardingStackBaseParams

  [Screens.Home]: undefined
}

export type AppStackParamList = {
  [Screens.AccountStack]: NavigatorScreenParams<AccountStackParamList>
  [Screens.Education]: {
    type: EducationContentType
  }
  [Screens.SettingsWalletManageConnection]: { address: Address }
  [Screens.Notifications]: undefined | { txHash: string }
  [Screens.OnboardingStack]: NavigatorScreenParams<OnboardingStackParamList>
  [Screens.SettingsStack]: NavigatorScreenParams<SettingsStackParamList>
  [Screens.TabNavigator]: NavigatorScreenParams<TabParamList>
  [Screens.TokenDetails]: {
    currencyId: string
  }
  [Screens.NFTItem]: NFTItem
  [Screens.ExternalProfile]: {
    address: string
  }
  [Screens.HiddenTokens]: {
    address: string
  }
  [Screens.Activity]: undefined
  [Screens.WebView]: { headerTitle: string; uriLink: string }
}

export type AppStackNavigationProp = NativeStackNavigationProp<AppStackParamList>
export type AppStackScreenProps = NativeStackScreenProps<AppStackParamList>
export type AppStackScreenProp<Screen extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  Screen
>

export type HomeStackNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  AppStackNavigationProp
>

export type ExploreStackNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ExploreStackParamList>,
  AppStackNavigationProp
>

export type SettingsStackNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<SettingsStackParamList>,
  AppStackNavigationProp
>

export type SettingsStackScreenProp<Screen extends keyof SettingsStackParamList> =
  CompositeScreenProps<NativeStackScreenProps<SettingsStackParamList, Screen>, AppStackScreenProps>

export type OnboardingStackNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<OnboardingStackParamList>,
  AppStackNavigationProp
>

export type RootParamList = TabParamList &
  HomeStackParamList &
  ExploreStackParamList &
  AccountStackParamList &
  SettingsStackParamList &
  OnboardingStackParamList &
  AppStackParamList

export const useAppStackNavigation = (): AppStackNavigationProp =>
  useNavigation<AppStackNavigationProp>()
export const useHomeStackNavigation = (): HomeStackNavigationProp =>
  useNavigation<HomeStackNavigationProp>()
export const useExploreStackNavigation = (): ExploreStackNavigationProp =>
  useNavigation<ExploreStackNavigationProp>()
export const useSettingsStackNavigation = (): SettingsStackNavigationProp =>
  useNavigation<SettingsStackNavigationProp>()
export const useOnboardingStackNavigation = (): OnboardingStackNavigationProp =>
  useNavigation<OnboardingStackNavigationProp>()
