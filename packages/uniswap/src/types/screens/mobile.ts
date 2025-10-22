import { ExtensionOnboardingFlow, ExtensionScreens } from 'uniswap/src/types/screens/extension'

export enum MobileScreens {
  Activity = 'Activity',
  Dev = 'Dev',
  Storybook = 'Storybook',
  Education = 'Education',
  ConnectionsDappListModal = 'connections-dapp-list-modal',
  Explore = 'Explore',
  Home = 'Home',
  NFTItem = 'NFTItem',
  NFTCollection = 'NFTCollection',
  OnboardingStack = 'OnboardingStack',
  UnitagStack = 'UnitagStack',
  Settings = 'Settings',
  SettingsCloudBackupPasswordCreate = 'SettingsCloudBackupPasswordCreate',
  SettingsCloudBackupPasswordConfirm = 'SettingsCloudBackupPasswordConfirm',
  SettingsCloudBackupProcessing = 'SettingsCloudBackupProcessing',
  SettingsCloudBackupStatus = 'SettingsCloudBackupStatus',
  SettingsLanguage = 'SettingsLanguage',
  SettingsNotifications = 'SettingsNotifications',
  SettingsPrivacy = 'SettingsPrivacy',
  SettingsSmartWallet = 'SettingsSmartWallet',
  SettingsWallet = 'SettingsWallet',
  SettingsWalletEdit = 'SettingsWalletEdit',
  SettingsWalletManageConnection = 'SettingsWalletManageConnection',
  SettingsHelpCenter = 'SettingsHelpCenter',
  SettingsStack = 'SettingsStack',
  SettingsViewSeedPhrase = 'SettingsViewSeedPhrase',
  TokenDetails = 'TokenDetails',
  ExternalProfile = 'ExternalProfile',
  WebView = 'WebView',
  ViewPrivateKeys = 'ViewPrivateKeys',
}

export enum OnboardingScreens {
  AppLoading = 'AppLoading',
  Backup = 'OnboardingBackup',
  BackupCloudPasswordCreate = 'OnboardingBackupCloudPasswordCreate',
  BackupCloudPasswordConfirm = 'OnboardingBackupCloudPasswordConfirm',
  BackupCloudProcessing = 'OnboardingBackupCloudProcessing',
  BackupManual = 'OnboardingBackupManual',
  Landing = 'OnboardingLanding',
  Notifications = 'OnboardingNotifications',
  WelcomeWallet = 'WelcomeWallet',
  PasskeyImport = 'PasskeyImport',
  Security = 'OnboardingSecurity',

  // import
  ImportMethod = 'ImportMethod',
  SeedPhraseInput = 'SeedPhraseInput',
  RestoreCloudBackupLoading = 'RestoreCloudBackupLoading',
  RestoreCloudBackup = 'RestoreCloudBackup',
  RestoreCloudBackupPassword = 'RestoreCloudBackupPassword',
  RestoreMethod = 'RestoreMethod',
  SelectWallet = 'SelectWallet',
  WatchWallet = 'WatchWallet',

  // on-device recovery
  OnDeviceRecovery = 'OnDeviceRecovery',
  OnDeviceRecoveryViewSeedPhrase = 'OnDeviceRecoveryViewSeedPhrase',
}

export enum UnitagScreens {
  ClaimUnitag = 'ClaimUnitag',
  ChooseProfilePicture = 'ChooseProfilePicture',
  UnitagConfirmation = 'UnitagConfirmation',
  EditProfile = 'EditProfile',
}

export type UnitagEntryPoint =
  | OnboardingScreens.Landing
  | MobileScreens.Home
  | MobileScreens.Settings
  | ExtensionOnboardingFlow.New
  | ExtensionScreens.Home

export type UnitagStackParamList = SharedUnitagScreenParams & {
  [UnitagScreens.UnitagConfirmation]: {
    unitag: string
    address: Address
    profilePictureUri?: string
  }
  [UnitagScreens.EditProfile]: {
    address: Address
    unitag: string
    entryPoint: UnitagScreens.UnitagConfirmation | MobileScreens.SettingsWallet
  }
}

export type SharedUnitagScreenParams = {
  [UnitagScreens.ClaimUnitag]: {
    entryPoint: UnitagEntryPoint
    address?: Address
  }
  [UnitagScreens.ChooseProfilePicture]: {
    entryPoint: UnitagEntryPoint
    unitag: string
    unitagFontSize: number
    address: Address
  }
}

export enum FiatOnRampScreens {
  AmountInput = 'FiatOnRampAmountInput',
  ServiceProviders = 'FiatOnRampServiceProviders',
  Connecting = 'FiatOnRampConnecting',
}

export type MobileNavScreen = MobileScreens | OnboardingScreens | UnitagScreens | FiatOnRampScreens
export type MobileAppScreen = MobileNavScreen | ManualPageViewScreen

/**
 * Views not within the navigation stack that we still want to
 * log Pageview events for. (Usually presented as nested views within another screen)
 */
export enum ManualPageViewScreen {
  WriteDownRecoveryPhrase = 'WriteDownRecoveryPhrase',
  ConfirmRecoveryPhrase = 'ConfirmRecoveryPhrase',
}
