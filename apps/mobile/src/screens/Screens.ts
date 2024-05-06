export enum Screens {
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
  Backup = 'OnboardingBackup',
  BackupCloudPasswordCreate = 'OnboardingBackupCloudPasswordCreate',
  BackupCloudPasswordConfirm = 'OnboardingBackupCloudPasswordConfirm',
  BackupCloudProcessing = 'OnboardingBackupCloudProcessing',
  BackupManual = 'OnboardingBackupManual',
  Landing = 'OnboardingLanding',
  EditName = 'EditName',
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

export type AppScreen = Screens | OnboardingScreens | UnitagScreens | FiatOnRampScreens
