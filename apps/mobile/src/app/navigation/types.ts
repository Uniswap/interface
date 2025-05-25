import {
  CompositeNavigationProp,
  CompositeScreenProps,
  NavigatorScreenParams,
  useNavigation,
} from '@react-navigation/native'
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'
import { TokenWarningModalState } from 'src/app/modals/TokenWarningModalState'
import { RemoveWalletModalState } from 'src/components/RemoveWallet/RemoveWalletModalState'
import { RestoreWalletModalState } from 'src/components/RestoreWalletModal/RestoreWalletModalState'
import { ConnectionsDappsListModalState } from 'src/components/Settings/ConnectionsDappModal/ConnectionsDappsListModalState'
import { EditWalletSettingsModalState } from 'src/components/Settings/EditWalletModal/EditWalletSettingsModalState'
import { ManageWalletsModalState } from 'src/components/Settings/ManageWalletsModalState'
import { BuyNativeTokenModalState } from 'src/components/TokenDetails/BuyNativeTokenModalState'
import { UnitagsIntroModalState } from 'src/components/unitags/UnitagsIntroModalState'
import { ScantasticModalState } from 'src/features/scantastic/ScantasticModalState'
import { TestnetSwitchModalState } from 'src/features/testnetMode/TestnetSwitchModalState'
import { HomeScreenTabIndex } from 'src/screens/HomeScreen/HomeScreenTabIndex'
import { ReceiveCryptoModalState } from 'src/screens/ReceiveCryptoModalState'
import { ViewPrivateKeysScreenState } from 'src/screens/ViewPrivateKeys/ViewPrivateKeysScreenState'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { PasskeyManagementModalState } from 'uniswap/src/features/passkey/PasskeyManagementModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestnetModeModalState } from 'uniswap/src/features/testnets/TestnetModeModal'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import {
  FiatOnRampScreens,
  MobileScreens,
  OnboardingScreens,
  SharedUnitagScreenParams,
  UnitagStackParamList,
} from 'uniswap/src/types/screens/mobile'
import { PostSwapSmartWalletNudgeState } from 'wallet/src/components/smartWallet/modals/PostSwapSmartWalletNudge'
import { SmartWalletEnabledModalState } from 'wallet/src/components/smartWallet/modals/SmartWalletEnabledModal'
import { NFTItem } from 'wallet/src/features/nfts/types'
import { SmartWalletAdvancedSettingsModalState } from 'wallet/src/features/smartWallet/modals/SmartWalletAdvancedSettingsModal'
import { SmartWalletConfirmModalState } from 'wallet/src/features/smartWallet/modals/SmartWalletConfirmModal'
import { SmartWalletInsufficientFundsOnNetworkModalState } from 'wallet/src/features/smartWallet/modals/SmartWalletInsufficientFundsOnNetworkModal'

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

type PasskeyImportParams = {
  passkeyCredential: string
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

type InnerExploreStackParamList = Omit<ExploreStackParamList, MobileScreens.Explore>

// The ExploreModalState allows a Screen and its Params to be defined, except for the initial Explore screen.
// This workaround facilitates navigation to any screen within the ExploreStack from outside.
// Implementation of this lives inside screens/ExploreScreen
type ExploreModalState = {
  [V in keyof InnerExploreStackParamList]: { screen: V; params: InnerExploreStackParamList[V] }
}[keyof InnerExploreStackParamList]

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
  [MobileScreens.SettingsSmartWallet]: undefined
  [MobileScreens.SettingsViewSeedPhrase]: { address: Address; walletNeedsRestore?: boolean }
  [MobileScreens.SettingsWallet]: { address: Address }
  [MobileScreens.SettingsWalletEdit]: { address: Address }
  [MobileScreens.SettingsWalletManageConnection]: { address: Address }
  [MobileScreens.ViewPrivateKeys]?: ViewPrivateKeysScreenState
  [MobileScreens.WebView]: { headerTitle: string; uriLink: string }
  [ModalName.Experiments]: undefined
  [ModalName.NotificationsOSSettings]: undefined
  [ModalName.UnitagsIntro]: UnitagsIntroModalState
  [ModalName.RestoreWallet]: RestoreWalletModalState
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
  [OnboardingScreens.PasskeyImport]: PasskeyImportParams & OnboardingStackBaseParams
  [OnboardingScreens.Security]: OnboardingStackBaseParams
  [MobileScreens.ViewPrivateKeys]?: ViewPrivateKeysScreenState

  // import
  [OnboardingScreens.ImportMethod]: OnboardingStackBaseParams
  [OnboardingScreens.RestoreMethod]: OnboardingStackBaseParams
  [OnboardingScreens.OnDeviceRecovery]: OnboardingStackBaseParams & { mnemonicIds: Address[] }
  [OnboardingScreens.OnDeviceRecoveryViewSeedPhrase]: {
    mnemonicId: string
  } & OnboardingStackBaseParams
  [OnboardingScreens.RestoreCloudBackupLoading]: OnboardingStackBaseParams
  [OnboardingScreens.RestoreCloudBackup]: OnboardingStackBaseParams
  [OnboardingScreens.RestoreCloudBackupPassword]: {
    mnemonicId: string
  } & OnboardingStackBaseParams
  [OnboardingScreens.SeedPhraseInput]: OnboardingStackBaseParams & {
    showAsCloudBackupFallback?: boolean
  }
  [OnboardingScreens.SelectWallet]: OnboardingStackBaseParams
  [OnboardingScreens.WatchWallet]: OnboardingStackBaseParams
  [ModalName.PrivateKeySpeedBumpModal]: undefined
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
  [MobileScreens.ViewPrivateKeys]?: ViewPrivateKeysScreenState
  [MobileScreens.WebView]: { headerTitle: string; uriLink: string }
  [MobileScreens.Storybook]: undefined
  [ModalName.Explore]: ExploreModalState | undefined
  [ModalName.NotificationsOSSettings]: undefined
  [ModalName.FundWallet]: undefined
  [ModalName.KoreaCexTransferInfoModal]: undefined
  [ModalName.ExchangeTransferModal]: { initialState: { serviceProvider: FORServiceProvider } }
  [ModalName.Experiments]: undefined
  [ModalName.TestnetSwitchModal]: { initialState: TestnetSwitchModalState }
  [ModalName.TokenWarning]: { initialState?: TokenWarningModalState }
  [ModalName.ViewOnlyExplainer]: undefined
  [ModalName.UnitagsIntro]: UnitagsIntroModalState
  [ModalName.RestoreWallet]: RestoreWalletModalState
  [ModalName.AccountSwitcher]: undefined
  [ModalName.Scantastic]: ScantasticModalState
  [ModalName.BackupReminder]: undefined
  [ModalName.BackupReminderWarning]: undefined
  [ModalName.RemoveWallet]: RemoveWalletModalState | undefined
  [ModalName.ReceiveCryptoModal]: ReceiveCryptoModalState
  [ModalName.TestnetMode]: TestnetModeModalState
  [ModalName.BuyNativeToken]: BuyNativeTokenModalState
  [ModalName.HiddenTokenInfoModal]: undefined
  [ModalName.ScreenshotWarning]: { acknowledgeText?: string } | undefined
  [ModalName.PasskeyManagement]: PasskeyManagementModalState
  [ModalName.PasskeysHelp]: undefined
  [ModalName.BiometricsModal]: undefined
  [ModalName.FiatCurrencySelector]: undefined
  [ModalName.ManageWalletsModal]: ManageWalletsModalState
  [ModalName.EditLabelSettingsModal]: EditWalletSettingsModalState
  [ModalName.EditProfileSettingsModal]: EditWalletSettingsModalState
  [ModalName.ConnectionsDappListModal]: ConnectionsDappsListModalState
  [ModalName.SmartWalletEnabledModal]: SmartWalletEnabledModalState
  [ModalName.SmartWalletAdvancedSettingsModal]: SmartWalletAdvancedSettingsModalState
  [ModalName.PrivateKeySpeedBumpModal]: undefined
  [ModalName.SmartWalletConfirmModal]: SmartWalletConfirmModalState
  [ModalName.SmartWalletInsufficientFundsOnNetworkModal]: SmartWalletInsufficientFundsOnNetworkModalState
  [ModalName.PostSwapSmartWalletNudge]: PostSwapSmartWalletNudgeState
  [ModalName.SettingsAppearance]: undefined
  [ModalName.PermissionsModal]: undefined
  [ModalName.PortfolioBalanceModal]: undefined
  [ModalName.LanguageSelector]: undefined
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
