import {
  CompositeNavigationProp,
  CompositeScreenProps,
  NavigatorScreenParams,
  useNavigation,
} from '@react-navigation/native'
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'
import { EducationContentType } from 'src/components/education'
import { ImportType, OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { TabIndex } from 'src/screens/HomeScreen'
import { OnboardingScreens, Screens } from 'src/screens/Screens'

type NFTItem = { owner: Address; address: string; tokenId: string; collectionName: string }

export type ExploreStackParamList = {
  [Screens.Explore]: undefined
  [Screens.ExternalProfile]: {
    address: string
  }
  [Screens.NFTItem]: NFTItem
  [Screens.NFTCollection]: { collectionAddress: string }
  [Screens.TokenDetails]: {
    currencyId: string
    currencyName?: string
  }
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
  [OnboardingScreens.Landing]: {
    shouldSkipToSeedPhraseInput?: boolean
  } // temporary to be able to view onboarding from settings
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
  [OnboardingScreens.Landing]: OnboardingStackBaseParams & {
    shouldSkipToSeedPhraseInput?: boolean
  }
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
}

export type AppStackParamList = {
  [Screens.AccountStack]: NavigatorScreenParams<AccountStackParamList>
  [Screens.Education]: {
    type: EducationContentType
  }
  [Screens.Home]?: { tab?: TabIndex }
  [Screens.SettingsWalletManageConnection]: { address: Address }
  [Screens.OnboardingStack]: NavigatorScreenParams<OnboardingStackParamList>
  [Screens.SettingsStack]: NavigatorScreenParams<SettingsStackParamList>
  [Screens.TokenDetails]: {
    currencyId: string
    currencyName?: string
  }
  [Screens.NFTItem]: NFTItem
  [Screens.NFTCollection]: { collectionAddress: string }
  [Screens.ExternalProfile]: {
    address: string
  }
  [Screens.WebView]: { headerTitle: string; uriLink: string }
}

export type AppStackNavigationProp = NativeStackNavigationProp<AppStackParamList>
export type AppStackScreenProps = NativeStackScreenProps<AppStackParamList>
export type AppStackScreenProp<Screen extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  Screen
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

export type RootParamList = AccountStackParamList &
  AppStackParamList &
  ExploreStackParamList &
  OnboardingStackParamList &
  SettingsStackParamList

export const useAppStackNavigation = (): AppStackNavigationProp =>
  useNavigation<AppStackNavigationProp>()
export const useExploreStackNavigation = (): ExploreStackNavigationProp =>
  useNavigation<ExploreStackNavigationProp>()
export const useSettingsStackNavigation = (): SettingsStackNavigationProp =>
  useNavigation<SettingsStackNavigationProp>()
export const useOnboardingStackNavigation = (): OnboardingStackNavigationProp =>
  useNavigation<OnboardingStackNavigationProp>()
