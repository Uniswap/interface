import {
  CompositeNavigationProp,
  CompositeScreenProps,
  NavigatorScreenParams,
  useNavigation,
} from '@react-navigation/native'
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'
import { EducationContentType } from 'src/components/education'
import { HomeScreenTabIndex } from 'src/screens/HomeScreenTabIndex'
import { OnboardingScreens, Screens, UnitagScreens } from 'src/screens/Screens'
import { NFTItem } from 'wallet/src/features/nfts/types'
import { ImportType, OnboardingEntryPoint } from 'wallet/src/features/onboarding/types'

type NFTItemScreenParams = {
  owner?: Address
  address: string
  tokenId: string
  isSpam?: boolean
  fallbackData?: NFTItem
}

export type CloudBackupFormParms = {
  address: Address
  password: string
}

export type ExploreStackParamList = {
  [Screens.Explore]: undefined
  [Screens.ExternalProfile]: {
    address: string
  }
  [Screens.NFTItem]: NFTItemScreenParams
  [Screens.NFTCollection]: { collectionAddress: string }
  [Screens.TokenDetails]: {
    currencyId: string
  }
}

export type SettingsStackParamList = {
  [Screens.Settings]: undefined
  [Screens.SettingsWallet]: { address: Address }
  [Screens.SettingsWalletEdit]: { address: Address }
  [Screens.SettingsWalletManageConnection]: { address: Address }
  [Screens.SettingsHelpCenter]: undefined
  [Screens.SettingsBiometricAuth]: undefined
  [Screens.SettingsAppearance]: undefined
  [Screens.SettingsLanguage]: undefined
  [Screens.WebView]: { headerTitle: string; uriLink: string }
  [Screens.Dev]: undefined
  [Screens.SettingsCloudBackupPasswordCreate]: { address: Address }
  [Screens.SettingsCloudBackupPasswordConfirm]: CloudBackupFormParms
  [Screens.SettingsCloudBackupProcessing]: CloudBackupFormParms
  [Screens.SettingsCloudBackupStatus]: { address: Address }
  [Screens.SettingsViewSeedPhrase]: { address: Address; walletNeedsRestore?: boolean }
}

export type OnboardingStackBaseParams = {
  importType: ImportType
  entryPoint: OnboardingEntryPoint
}

export type OnboardingStackParamList = {
  [OnboardingScreens.BackupManual]: OnboardingStackBaseParams
  [OnboardingScreens.BackupCloudPasswordCreate]: {
    address: Address
  } & OnboardingStackBaseParams
  [OnboardingScreens.BackupCloudPasswordConfirm]: CloudBackupFormParms & OnboardingStackBaseParams
  [OnboardingScreens.BackupCloudProcessing]: CloudBackupFormParms & OnboardingStackBaseParams
  [OnboardingScreens.Backup]: OnboardingStackBaseParams
  [OnboardingScreens.Landing]: OnboardingStackBaseParams
  [OnboardingScreens.EditName]: OnboardingStackBaseParams
  [OnboardingScreens.Notifications]: OnboardingStackBaseParams
  [OnboardingScreens.QRAnimation]: OnboardingStackBaseParams
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

export type UnitagStackParamList = {
  [UnitagScreens.ClaimUnitag]: { entryPoint: OnboardingScreens.Landing | Screens.Home }
  [UnitagScreens.ChooseProfilePicture]: {
    entryPoint: OnboardingScreens.Landing | Screens.Home
    unitag: string
  }
  [UnitagScreens.UnitagConfirmation]: {
    unitag: string
    address: Address
    profilePictureUri?: string
  }
  [UnitagScreens.EditProfile]: {
    address: Address
  }
}

export type AppStackParamList = {
  [Screens.Education]: {
    type: EducationContentType
  } & OnboardingStackBaseParams
  [Screens.Home]?: { tab?: HomeScreenTabIndex }
  [Screens.OnboardingStack]: NavigatorScreenParams<OnboardingStackParamList>
  [Screens.SettingsStack]: NavigatorScreenParams<SettingsStackParamList>
  [Screens.UnitagStack]: NavigatorScreenParams<UnitagStackParamList>
  [Screens.TokenDetails]: {
    currencyId: string
  }
  [Screens.NFTItem]: NFTItemScreenParams
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

export type UnitagStackScreenProp<Screen extends keyof UnitagStackParamList> =
  NativeStackScreenProps<UnitagStackParamList, Screen>

export type RootParamList = AppStackParamList &
  ExploreStackParamList &
  OnboardingStackParamList &
  SettingsStackParamList &
  UnitagStackParamList

export const useAppStackNavigation = (): AppStackNavigationProp =>
  useNavigation<AppStackNavigationProp>()
export const useExploreStackNavigation = (): ExploreStackNavigationProp =>
  useNavigation<ExploreStackNavigationProp>()
export const useSettingsStackNavigation = (): SettingsStackNavigationProp =>
  useNavigation<SettingsStackNavigationProp>()
export const useOnboardingStackNavigation = (): OnboardingStackNavigationProp =>
  useNavigation<OnboardingStackNavigationProp>()
