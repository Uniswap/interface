import {
  CompositeNavigationProp,
  CompositeScreenProps,
  NavigatorScreenParams,
  useNavigation,
} from '@react-navigation/native'
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'
import { ConnectionsDappsListModalState } from 'src/components/Settings/ConnectionsDappModal/ConnectionsDappsListModalState'
import { HomeScreenTabIndex } from 'src/screens/HomeScreen/HomeScreenTabIndex'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import {
  FiatOnRampScreens,
  MobileScreens,
  OnboardingScreens,
  SharedUnitagScreenParams,
  UnitagStackParamList,
} from 'uniswap/src/types/screens/mobile'
import { NFTItem } from 'wallet/src/features/nfts/types'

type NFTItemScreenParams = {
  owner?: Address
  address: string
  tokenId: string
  isSpam?: boolean
  fallbackData?: NFTItem
}

type BackupFormParams = {
  address: Address
}

type CloudBackupFormParams = {
  address: Address
  password: string
}

export type ExploreStackParamList = {
  [MobileScreens.Explore]: undefined
  [MobileScreens.ExternalProfile]: {
    address: string
  }
  [MobileScreens.NFTItem]: NFTItemScreenParams
  [MobileScreens.NFTCollection]: { collectionAddress: string }
  [MobileScreens.TokenDetails]: {
    currencyId: string
  }
}

export type FiatOnRampStackParamList = {
  [FiatOnRampScreens.AmountInput]: undefined
  [FiatOnRampScreens.ServiceProviders]: undefined
  [FiatOnRampScreens.Connecting]: undefined
}

export type SettingsStackParamList = {
  [MobileScreens.Dev]: undefined
  [MobileScreens.Settings]: undefined
  [MobileScreens.SettingsCloudBackupPasswordConfirm]: CloudBackupFormParams
  [MobileScreens.SettingsCloudBackupPasswordCreate]: { address: Address }
  [MobileScreens.SettingsCloudBackupProcessing]: CloudBackupFormParams
  [MobileScreens.SettingsCloudBackupStatus]: { address: Address }
  [MobileScreens.SettingsHelpCenter]: undefined
  [MobileScreens.SettingsLanguage]: undefined
  [MobileScreens.SettingsNotifications]: undefined
  [MobileScreens.SettingsPrivacy]: undefined
  [MobileScreens.SettingsViewSeedPhrase]: { address: Address; walletNeedsRestore?: boolean }
  [MobileScreens.SettingsWallet]: { address: Address }
  [MobileScreens.SettingsWalletEdit]: { address: Address }
  [MobileScreens.SettingsWalletManageConnection]: { address: Address }
  [MobileScreens.WebView]: { headerTitle: string; uriLink: string }
  [ModalName.BiometricsModal]: undefined
  [ModalName.NotificationsOSSettings]: undefined
  [ModalName.SettingsAppearance]: undefined
  [ModalName.ConnectionsDappListModal]: ConnectionsDappsListModalState
  [ModalName.EditProfileSettingsModal]: undefined
  [ModalName.EditLabelSettingsModal]: undefined
}

export type OnboardingStackBaseParams = {
  importType: ImportType
  entryPoint: OnboardingEntryPoint
}

export type OnboardingStackParamList = {
  [OnboardingScreens.AppLoading]: undefined
  [OnboardingScreens.BackupManual]: BackupFormParams & OnboardingStackBaseParams & { fromCloudBackup?: boolean }
  [OnboardingScreens.BackupCloudPasswordCreate]: BackupFormParams & OnboardingStackBaseParams
  [OnboardingScreens.BackupCloudPasswordConfirm]: CloudBackupFormParams & OnboardingStackBaseParams
  [OnboardingScreens.BackupCloudProcessing]: CloudBackupFormParams & OnboardingStackBaseParams
  [OnboardingScreens.Backup]: OnboardingStackBaseParams
  [OnboardingScreens.Landing]: OnboardingStackBaseParams
  [OnboardingScreens.Notifications]: OnboardingStackBaseParams
  [OnboardingScreens.WelcomeWallet]: OnboardingStackBaseParams
  [OnboardingScreens.Security]: OnboardingStackBaseParams

  // import
  [OnboardingScreens.ImportMethod]: OnboardingStackBaseParams
  [OnboardingScreens.OnDeviceRecovery]: OnboardingStackBaseParams & { mnemonicIds: Address[] }
  [OnboardingScreens.OnDeviceRecoveryViewSeedPhrase]: {
    mnemonicId: string
  } & OnboardingStackBaseParams
  [OnboardingScreens.RestoreCloudBackupLoading]: OnboardingStackBaseParams
  [OnboardingScreens.RestoreCloudBackup]: OnboardingStackBaseParams
  [OnboardingScreens.RestoreCloudBackupPassword]: {
    mnemonicId: string
  } & OnboardingStackBaseParams
  [OnboardingScreens.SeedPhraseInput]: OnboardingStackBaseParams
  [OnboardingScreens.SelectWallet]: OnboardingStackBaseParams
  [OnboardingScreens.WatchWallet]: OnboardingStackBaseParams
} & SharedUnitagScreenParams

export type AppStackParamList = {
  [MobileScreens.Education]: {
    type: EducationContentType
  } & OnboardingStackBaseParams
  [MobileScreens.Home]?: { tab?: HomeScreenTabIndex }
  [MobileScreens.OnboardingStack]: NavigatorScreenParams<OnboardingStackParamList>
  [MobileScreens.SettingsStack]: NavigatorScreenParams<SettingsStackParamList>
  [MobileScreens.UnitagStack]: NavigatorScreenParams<UnitagStackParamList>
  [MobileScreens.TokenDetails]: {
    currencyId: string
  }
  [MobileScreens.NFTItem]: NFTItemScreenParams
  [MobileScreens.NFTCollection]: { collectionAddress: string }
  [MobileScreens.ExternalProfile]: {
    address: string
  }
  [MobileScreens.WebView]: { headerTitle: string; uriLink: string }
  [MobileScreens.Storybook]: undefined
  [ModalName.NotificationsOSSettings]: undefined
  [ModalName.FundWallet]: undefined
  [ModalName.KoreaCexTransferInfoModal]: undefined
  [ModalName.ExchangeTransferModal]: { initialState: { serviceProvider: FORServiceProvider } }
  [ModalName.Experiments]: undefined
}

export type AppStackNavigationProp = NativeStackNavigationProp<AppStackParamList>
type AppStackScreenProps = NativeStackScreenProps<AppStackParamList>
export type AppStackScreenProp<Screen extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  Screen
>

type ExploreStackNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ExploreStackParamList>,
  AppStackNavigationProp
>

export type SettingsStackNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<SettingsStackParamList>,
  AppStackNavigationProp
>

export type SettingsStackScreenProp<Screen extends keyof SettingsStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<SettingsStackParamList, Screen>,
  AppStackScreenProps
>

export type OnboardingStackNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<OnboardingStackParamList>,
  AppStackNavigationProp
>

export type UnitagStackScreenProp<Screen extends keyof UnitagStackParamList> = NativeStackScreenProps<
  UnitagStackParamList,
  Screen
>

export type RootParamList = AppStackParamList &
  ExploreStackParamList &
  OnboardingStackParamList &
  SettingsStackParamList &
  UnitagStackParamList &
  FiatOnRampStackParamList

export enum EducationContentType {
  SeedPhrase = 0,
}

export const useAppStackNavigation = (): AppStackNavigationProp => useNavigation<AppStackNavigationProp>()
export const useExploreStackNavigation = (): ExploreStackNavigationProp => useNavigation<ExploreStackNavigationProp>()
export const useSettingsStackNavigation = (): SettingsStackNavigationProp =>
  useNavigation<SettingsStackNavigationProp>()
export const useOnboardingStackNavigation = (): OnboardingStackNavigationProp =>
  useNavigation<OnboardingStackNavigationProp>()
