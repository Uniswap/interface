export enum Screens {
  Accounts = 'Accounts',
  AccountStack = 'AccountStack',
  Dev = 'Dev',
  Education = 'Education',
  Explore = 'Explore',
  Home = 'Home',
  NFTItem = 'NFTItem',
  NFTCollection = 'NFTCollection',
  OnboardingStack = 'OnboardingStack',
  Settings = 'Settings',
  SettingsCloudBackupPasswordCreate = 'SettingsCloudBackupPasswordCreate',
  SettingsCloudBackupPasswordConfirm = 'SettingsCloudBackupPasswordConfirm',
  SettingsCloudBackupProcessing = 'SettingsCloudBackupProcessing',
  SettingsCloudBackupStatus = 'SettingsCloudBackupStatus',
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
  SelectColor = 'SelectColor',
  Notifications = 'OnboardingNotifications',
  QRAnimation = 'QRAnimation',
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

export enum Stacks {
  AppStack = 'AppStack',
}

export type AppScreen = Screens | OnboardingScreens
