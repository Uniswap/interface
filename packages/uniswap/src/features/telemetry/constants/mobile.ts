/**
 * Event names that occur in this specific application
 */
export enum MobileEventName {
  AutomatedOnDeviceRecoveryTriggered = 'Automated On Device Recovery Triggered',
  AutomatedOnDeviceRecoveryMnemonicsFound = 'Automated On Device Recovery Mnemonics Found',
  AutomatedOnDeviceRecoverySingleMnemonicFetched = 'Automated On Device Recovery Mnemonic Fetched',
  DeepLinkOpened = 'Deep Link Opened',
  ExploreFilterSelected = 'Explore Filter Selected',
  ExploreSearchResultClicked = 'Explore Search Result Clicked',
  ExploreTokenItemSelected = 'Explore Token Item Selected',
  ExploreNetworkSelected = 'Explore Network Selected',
  ExploreSearchNetworkSelected = 'Explore Search Network Selected',
  FavoriteItem = 'Favorite Item',
  FiatOnRampQuickActionButtonPressed = 'Fiat OnRamp QuickAction Button Pressed',
  HomeExploreTokenItemSelected = 'Home Explore Token Item Selected',
  NotificationsToggled = 'Notifications Toggled',
  OnboardingCompleted = 'Onboarding Completed',
  PerformanceReport = 'Performance Report',
  RestoreSuccess = 'Restore Success',
  SeedPhraseInputSubmitError = 'Seed Phrase Input Submit Error',
  ShareLinkOpened = 'Share Link Opened',
  SwapLongPress = 'Swap Long Press',
  TokenDetailsOtherChainButtonPressed = 'Token Details Other Chain Button Pressed',
  TokenDetailsContextMenuAction = 'Token Details Context Menu Action Selected',
  WalletConnectSheetCompleted = 'Wallet Connect Sheet Completed',
  WidgetClicked = 'Widget Clicked',
  WidgetConfigurationUpdated = 'Widget Configuration Updated',
  // alphabetize additional values.
}

export enum MobileAppsFlyerEvents {
  OnboardingCompleted = 'onboarding_complete',
  SwapCompleted = 'swap_completed',
  WalletFunded = 'wallet_funded',
}
