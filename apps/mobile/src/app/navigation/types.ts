import { useNavigation } from '@react-navigation/native'
import type { CompositeNavigationProp, CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'
import type { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { TokenWarningModalState } from 'src/app/modals/TokenWarningModalState'
import type { EarnDepositAmountModalState } from 'src/components/earn/EarnDepositAmountModalState'
import type { EarnDepositReviewModalProps } from 'src/components/earn/EarnDepositReviewModalState'
import type { EarnDepositSourceSelectorModalProps } from 'src/components/earn/EarnDepositSourceSelectorModalState'
import type { EarnVaultModalProps } from 'src/components/earn/EarnVaultModalState'
import type { EarnWithdrawNetworkSelectorModalProps } from 'src/components/earn/EarnWithdrawNetworkSelectorModalState'
import type { EarnWithdrawReviewModalProps } from 'src/components/earn/EarnWithdrawReviewModalState'
import type { EarnYouNeedTokenModalProps } from 'src/components/earn/EarnYouNeedTokenModal'
import type { RemoveWalletModalState } from 'src/components/RemoveWallet/RemoveWalletModalState'
import type {
  RestoreWalletModalState,
  WalletRestoreType,
} from 'src/components/RestoreWalletModal/RestoreWalletModalState'
import type { ConnectionsDappsListModalState } from 'src/components/Settings/ConnectionsDappModal/ConnectionsDappsListModalState'
import type { EditWalletSettingsModalState } from 'src/components/Settings/EditWalletModal/EditWalletSettingsModalState'
import type { ManageWalletsModalState } from 'src/components/Settings/ManageWalletsModalState'
import type { BuyNativeTokenModalState } from 'src/components/TokenDetails/BuyNativeTokenModalState'
import type { UnitagsIntroModalState } from 'src/components/unitags/UnitagsIntroModalState'
import type { CloudStorageMnemonicBackup } from 'src/features/CloudBackup/types'
import type { ScantasticModalState } from 'src/features/scantastic/ScantasticModalState'
import type { TestnetSwitchModalState } from 'src/features/testnetMode/TestnetSwitchModalState'
import type { HomeScreenTabIndex } from 'src/screens/HomeScreen/HomeScreenTabIndex'
import type { ReceiveCryptoModalState } from 'src/screens/ReceiveCryptoModalState'
import type { ViewPrivateKeysScreenState } from 'src/screens/ViewPrivateKeys/ViewPrivateKeysScreenState'
import type { BridgedAssetModalProps } from 'uniswap/src/components/BridgedAsset/BridgedAssetModal'
import type { WormholeModalProps } from 'uniswap/src/components/BridgedAsset/WormholeModal'
import type { ReportPortfolioDataModalProps } from 'uniswap/src/components/reporting/ReportPortfolioDataModal'
import type { ReportTokenDataModalProps } from 'uniswap/src/components/reporting/ReportTokenDataModal'
import type { ReportTokenModalProps } from 'uniswap/src/components/reporting/ReportTokenIssueModal'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import type { PasskeyManagementModalState } from 'uniswap/src/features/passkey/PasskeyManagementModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import type { TestnetModeModalState } from 'uniswap/src/features/testnets/TestnetModeModal'
import type { TransactionState } from 'uniswap/src/features/transactions/types/transactionState'
import type { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { FiatOnRampScreens, MobileScreens, OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import type { SharedUnitagScreenParams, UnitagStackParamList } from 'uniswap/src/types/screens/mobile'
import type { AboutModalState } from 'wallet/src/components/settings/about/AboutModal'
import type { SmartWalletAdvancedSettingsModalState } from 'wallet/src/components/smartWallet/modals/SmartWalletAdvancedSettingsModal'
import type { SmartWalletEnabledModalState } from 'wallet/src/components/smartWallet/modals/SmartWalletEnabledModal'
import type { SmartWalletNudgeState } from 'wallet/src/components/smartWallet/modals/SmartWalletNudge'
import type { ExploreOrderBy } from 'wallet/src/features/wallet/types'

export type ExploreScreenParams = {
  showFavorites?: boolean
  orderByMetric?: ExploreOrderBy
  chainId?: UniverseChainId
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
  [MobileScreens.Explore]: ExploreScreenParams
  [MobileScreens.ExternalProfile]: {
    address: string
  }
  [MobileScreens.TokenDetails]: {
    currencyId: string
    isMultichainAsset?: boolean
  }
}

// The ExploreModalState allows a Screen and its Params to be defined.
// This workaround facilitates navigation to any screen within the ExploreStack from outside.
export type ExploreModalState = {
  [V in keyof ExploreStackParamList]: { screen: V; params: ExploreStackParamList[V] }
}[keyof ExploreStackParamList]

export type FiatOnRampStackParamList = {
  [FiatOnRampScreens.AmountInput]: undefined
  [FiatOnRampScreens.ServiceProviders]: undefined
  [FiatOnRampScreens.Connecting]: undefined
}

export type SettingsStackParamList = {
  [MobileScreens.DebugScreens]: undefined
  [MobileScreens.Dev]: undefined
  [MobileScreens.Settings]: undefined
  [MobileScreens.SettingsCloudBackupPasswordConfirm]: CloudBackupFormParams
  [MobileScreens.SettingsCloudBackupPasswordCreate]: { address: Address }
  [MobileScreens.SettingsCloudBackupProcessing]: CloudBackupFormParams
  [MobileScreens.SettingsCloudBackupStatus]: { address: Address }
  [MobileScreens.SettingsDisclosures]: undefined
  [MobileScreens.SettingsHelpCenter]: undefined
  [MobileScreens.SettingsLanguage]: undefined
  [MobileScreens.SettingsNotifications]: undefined
  [MobileScreens.SettingsPrivacy]: undefined
  [MobileScreens.SettingsSmartWallet]: undefined
  [MobileScreens.SettingsStorage]: undefined
  [MobileScreens.SettingsViewSeedPhrase]: { address?: Address; walletNeedsRestore?: boolean } | undefined
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
  restoreType?: WalletRestoreType
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
  [OnboardingScreens.RecoveryFlow]: OnboardingStackBaseParams & {
    // 'passkey' keeps the Login step visible but auto-triggers the passkey ceremony on
    // mount so the user lands directly on the native prompt; failure falls back to the
    // email/OAuth tiles on the same view. OAuth redirects land here post-return, so the
    // default initial step is driven by the hook itself (OAUTH_LOADING if pending, else EMAIL_ENTRY).
    initialMethod?: 'passkey'
  }
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
  [OnboardingScreens.RestoreCloudBackup]: {
    backups: CloudStorageMnemonicBackup[]
  } & OnboardingStackBaseParams
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
  [MobileScreens.Activity]: undefined
  [MobileScreens.HashcashBenchmark]: undefined
  [MobileScreens.SessionsDebug]: undefined
  [MobileScreens.Education]: {
    type: EducationContentType
  } & OnboardingStackBaseParams
  [MobileScreens.Home]?: { tab?: HomeScreenTabIndex }
  [MobileScreens.OnboardingStack]: NavigatorScreenParams<OnboardingStackParamList>
  [MobileScreens.PortfolioChartDetails]: undefined
  [MobileScreens.PositionDetails]: {
    poolId: string
    tokenId?: string
    chainId: UniverseChainId
    protocolVersion: ProtocolVersion
    owner?: Address
  }
  [MobileScreens.SettingsStack]: NavigatorScreenParams<SettingsStackParamList>
  [MobileScreens.UnitagStack]: NavigatorScreenParams<UnitagStackParamList>
  [MobileScreens.TokenDetails]: {
    currencyId: string
    isMultichainAsset?: boolean
  }
  [MobileScreens.ExternalProfile]: {
    address: string
  }
  [MobileScreens.ViewPrivateKeys]?: ViewPrivateKeysScreenState
  [MobileScreens.WebView]: { headerTitle: string; uriLink: string }
  [MobileScreens.Storybook]: undefined
  [ModalName.Swap]: TransactionState | undefined
  [ModalName.Explore]: ExploreModalState | undefined
  [ModalName.NotificationsOSSettings]: undefined
  [ModalName.FiatOnRampAction]: { entry: 'onramp' | 'offramp' }
  [ModalName.FundWallet]: undefined
  [ModalName.KoreaCexTransferInfoModal]: undefined
  [ModalName.ExchangeTransferModal]: { initialState: { serviceProvider: FORServiceProvider } }
  [ModalName.Experiments]: undefined
  [ModalName.TestnetSwitchModal]: TestnetSwitchModalState
  [ModalName.TokenWarning]: { initialState?: TokenWarningModalState }
  [ModalName.BridgedAssetNav]: { initialState?: TokenWarningModalState }
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
  [ModalName.BiometricsModal]: undefined
  [ModalName.FiatCurrencySelector]: undefined
  [ModalName.ManageWalletsModal]: ManageWalletsModalState
  [ModalName.EditLabelSettingsModal]: EditWalletSettingsModalState
  [ModalName.EditProfileSettingsModal]: EditWalletSettingsModalState
  [ModalName.ConnectionsDappListModal]: ConnectionsDappsListModalState
  [ModalName.SmartWalletEnabledModal]: SmartWalletEnabledModalState
  [ModalName.SmartWalletAdvancedSettingsModal]: SmartWalletAdvancedSettingsModalState
  [ModalName.PrivateKeySpeedBumpModal]: undefined
  [ModalName.SmartWalletNudge]: SmartWalletNudgeState
  [ModalName.SettingsAppearance]: undefined
  [ModalName.NetworkCostPicker]: undefined
  [ModalName.PermissionsModal]: undefined
  [ModalName.PortfolioBalanceModal]: undefined
  [ModalName.About]: AboutModalState
  [ModalName.LanguageSelector]: undefined
  [ModalName.SmartWalletInfoModal]: undefined
  [ModalName.ConfirmDisableSmartWalletScreen]: undefined
  [ModalName.BridgedAsset]: BridgedAssetModalProps
  [ModalName.Wormhole]: WormholeModalProps
  [ModalName.ReportTokenIssue]: ReportTokenModalProps
  [ModalName.ReportPortfolioData]: ReportPortfolioDataModalProps
  [ModalName.ReportTokenData]: ReportTokenDataModalProps
  [ModalName.EarnDepositAmount]: EarnDepositAmountModalState
  [ModalName.EarnDepositReview]: EarnDepositReviewModalProps
  [ModalName.EarnDepositSourceSelector]: EarnDepositSourceSelectorModalProps
  [ModalName.EarnVault]: EarnVaultModalProps
  [ModalName.EarnWithdrawNetworkSelector]: EarnWithdrawNetworkSelectorModalProps
  [ModalName.EarnWithdrawReview]: EarnWithdrawReviewModalProps
  [ModalName.EarnYouNeedToken]: EarnYouNeedTokenModalProps
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
