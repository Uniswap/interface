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
  SettingsCloudBackupStatus = 'SettingsCloudBackupStatus',
  SettingsCloudBackupScreen = 'SettingsCloudBackupScreen',
  SettingsWallet = 'SettingsWallet',
  SettingsWalletEdit = 'SettingsWalletEdit',
  SettingsWalletManageConnection = 'SettingsWalletManageConnection',
  SettingsHelpCenter = 'SettingsHelpCenter',
  SettingsChains = 'SettingsChains',
  SettingsStack = 'SettingsStack',
  SettingsTestConfigs = 'SettingsTestConfigs',
  SettingsBiometricAuth = 'SettingsBiometricAuth',
  SettingsAppearance = 'SettingsAppearance',
  SettingsViewSeedPhrase = 'SettingsViewSeedPhrase',
  TokenDetails = 'TokenDetails',
  ExternalProfile = 'ExternalProfile',
  WebView = 'WebView',
}

export enum OnboardingScreens {
  Backup = 'OnboardingBackup',
  BackupCloudPassword = 'OnboardingBackupCloudPassword',
  BackupCloudProcessing = 'OnboardingBackupCloudProcessing',
  BackupManual = 'OnboardingBackupManual',
  Landing = 'OnboardingLanding',
  EditName = 'EditName',
  SelectColor = 'SelectColor',
  Notifications = 'OnboardingNotifications',
  Outro = 'OnboardingOutro',
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

export enum Tabs {
  Explore = 'ExploreTab',
  Home = 'HomeTab',
  Profile = 'Profile',
  SwapButton = 'SwapButton',
}

export enum Stacks {
  AppStack = 'AppStack',
}

export type AppScreen = Screens | OnboardingScreens
