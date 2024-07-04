export enum MobileScreens {
  Dev = 'Dev',
  Education = 'Education',
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
  SettingsPrivacy = 'SettingsPrivacy',
  SettingsWallet = 'SettingsWallet',
  SettingsWalletEdit = 'SettingsWalletEdit',
  SettingsWalletManageConnection = 'SettingsWalletManageConnection',
  SettingsHelpCenter = 'SettingsHelpCenter',
  SettingsStack = 'SettingsStack',
  SettingsBiometricAuth = 'SettingsBiometricAuth',
  SettingsAppearance = 'SettingsAppearance',
  SettingsViewSeedPhrase = 'SettingsViewSeedPhrase',
  TokenDetails = 'TokenDetails',
  ExternalProfile = 'ExternalProfile',
  WebView = 'WebView',
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
  Security = 'OnboardingSecurity',

  // import
  ImportMethod = 'ImportMethod',
  SeedPhraseInput = 'SeedPhraseInput',
  RestoreCloudBackupLoading = 'RestoreCloudBackupLoading',
  RestoreCloudBackup = 'RestoreCloudBackup',
  RestoreCloudBackupPassword = 'RestoreCloudBackupPassword',
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

export enum FiatOnRampScreens {
  AmountInput = 'FiatOnRampAmountInput',
  ServiceProviders = 'FiatOnRampServiceProviders',
  Connecting = 'FiatOnRampConnecting',
}

export type MobileAppScreen = MobileScreens | OnboardingScreens | UnitagScreens | FiatOnRampScreens

/**
 * Views not within the navigation stack that we still want to
 * log Pageview events for. (Usually presented as nested views within another screen)
 */
export enum ManualPageViewScreen {
  WriteDownRecoveryPhrase = 'WriteDownRecoveryPhrase',
  ConfirmRecoveryPhrase = 'ConfirmRecoveryPhrase',
}
