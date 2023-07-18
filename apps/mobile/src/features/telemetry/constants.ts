/**
 * Event names that can occur in this application
 *
 * Subject to change as new features are added and new events are defined and logged.
 */
export enum MobileEventName {
  // keep these alphabetized or else you will go to JAIL!

  // some of these values are Title Cased to match shared repo event format:
  // https://github.com/Uniswap/analytics-events/blob/main/src/primitives.ts
  BalancesReport = 'Balances Report',
  DeepLinkOpened = 'Deep Link Opened',
  ExploreFilterSelected = 'Explore Filter Selected',
  ExploreSearchResultClicked = 'Explore Search Result Clicked',
  ExploreSearchCancel = 'Explore Search Cancel',
  ExploreTokenItemSelected = 'Explore Token Item Selected',
  FavoriteItem = 'Favorite Item',
  // General fiat onramp events like in-app buttons and modals
  FiatOnRampBannerPressed = 'Fiat OnRamp Banner Pressed',
  FiatOnRampQuickActionButtonPressed = 'Fiat OnRamp QuickAction Button Pressed',
  FiatOnRampAmountEntered = 'Fiat OnRamp Amount Entered',
  FiatOnRampWidgetOpened = 'Fiat OnRamp Widget Opened',
  NetworkFilterSelected = 'Network Filter Selected',
  OnboardingCompleted = 'Onboarding Completed',
  PerformanceReport = 'Performance Report',
  PerformanceGraphql = 'Performance GraphQL',
  PortfolioBalanceFreshnessLag = 'Portfolio Balance Freshness Lag',
  SwapSubmitted = 'Swap Submitted to Provider',
  TokenDetailsOtherChainButtonPressed = 'Token Details Other Chain Button Pressed',
  TokenSelected = 'Token Selected',
  WalletAdded = 'Wallet Added',
  WalletConnectSheetCompleted = 'Wallet Connect Sheet Completed',
}

/**
 * Known sections to provide telemetry context.
 * Can help disambiguate low-level elements that may share a name.
 * For example, a `back` button in a modal will have the same
 * `elementName`, but a different `section`.
 */
export const enum SectionName {
  CurrencyInputPanel = 'currency-input-panel',
  CurrencyOutputPanel = 'currency-output-panel',
  ExploreFavoriteTokensSection = 'explore-favorite-tokens-section',
  ExploreSearch = 'explore-search',
  ExploreTopTokensSection = 'explore-top-tokens-section',
  HomeActivityTab = 'home-activity-tab',
  HomeNFTsTab = 'home-nfts-tab',
  HomeTokensTab = 'home-tokens-tab',
  ImportAccountForm = 'import-account-form',
  ProfileActivityTab = 'profile-activity-tab',
  ProfileNftsTab = 'profile-nfts-tab',
  ProfileTokensTab = 'profile-tokens-tab',
  Sidebar = 'sidebar',
  SwapForm = 'swap-form',
  SwapPending = 'swap-pending',
  SwapReview = 'swap-review',
  TokenSelector = 'token-selector',
  TransferForm = 'transfer-form',
  TransferPending = 'transfer-pending',
  TransferReview = 'transfer-review',
  // alphabetize additional values.
}

/** Known modals for telemetry purposes. */
export const enum ModalName {
  AccountEdit = 'account-edit-modal',
  AccountSwitcher = 'account-switcher-modal',
  AddWallet = 'add-wallet-modal',
  BlockedAddress = 'blocked-address',
  Experiments = 'experiments',
  Explore = 'explore-modal',
  FaceIDWarning = 'face-id-warning',
  FiatOnRamp = 'fiat-on-ramp',
  ForceUpgradeModal = 'force-upgrade-modal',
  ICloudBackupInfo = 'icloud-backup-info-modal',
  NetworkSelector = 'network-selector-modal',
  NftCollection = 'nft-collection',
  RecoveryWarning = 'recovery-warning',
  RemoveWallet = 'remove-wallet-modal',
  RemoveSeedPhraseWarningModal = 'remove-seed-phrase-warning-modal',
  ReimportUninstall = 'reimport-uninstall-modal',
  ScreenshotWarning = 'screenshot-warning',
  Send = 'send-modal',
  SeedPhraseWarningModal = 'seed-phrase-warning-modal',
  SendWarning = 'send-warning-modal',
  SlippageInfo = 'slippage-info-modal',
  Swap = 'swap-modal',
  SwapSettings = 'swap-settings-modal',
  SwapWarning = 'swap-warning-modal',
  GasEstimateWarning = 'gas-estimate-warning-modal',
  TokenSelector = 'token-selector',
  TokenWarningModal = 'token-warning-modal',
  TooltipContent = 'tooltip-content',
  TransactionActions = 'transaction-actions',
  ViewSeedPhraseWarning = 'view-seed-phrase-warning',
  WalletConnectScan = 'wallet-connect-scan-modal',
  WCDappConnectedNetworks = 'wc-dapp-connected-networks-modal',
  WCPendingConnection = 'wc-pending-connection-modal',
  WCSignRequest = 'wc-sign-request-modal',
  WCSwitchChainRequest = 'wc-switch-chain-request-modal',
  WCViewOnlyWarning = 'wc-view-only-warning-modal',
  // alphabetize additional values.
}

/**
 * Views not within the navigation stack that we still want to
 * log Pageview events for. (Usually presented as nested views within another screen)
 */
export const enum ManualPageViewScreen {
  WriteDownRecoveryPhrase = 'WriteDownRecoveryPhrase',
  ConfirmRecoveryPhrase = 'ConfirmRecoveryPhrase',
}

/**
 * Known element names for telemetry purposes.
 * Use to identify low-level components given a TraceContext
 */

export const enum ElementName {
  AcceptNewRate = 'accept-new-rate',
  AccountCard = 'account-card',
  AddManualBackup = 'add-manual-backup',
  AddViewOnlyWallet = 'add-view-only-wallet',
  AddiCloudBackup = 'add-icloud-backup',
  AddBackupNone = 'add-backup-none',
  Back = 'back',
  Buy = 'buy',
  Cancel = 'cancel',
  Confirm = 'confirm',
  Continue = 'continue',
  Copy = 'copy',
  CreateAccount = 'create-account',
  Disconnect = 'disconnect',
  Edit = 'edit',
  EmptyStateBuy = 'empty-state-buy',
  EmptyStateGetStarted = 'empty-state-get-started',
  EmptyStateImport = 'empty-state-get-import',
  EmptyStateReceive = 'empty-state-receive',
  Enable = 'enable',
  EtherscanView = 'etherscan-view',
  Favorite = 'favorite',
  FiatOnRampTokenSelector = 'fiat-on-ramp-token-selector',
  FiatOnRampWidgetButton = 'fiat-on-ramp-widget-button',
  GetHelp = 'get-help',
  GetStarted = 'get-started',
  ImportAccount = 'import',
  Manage = 'manage',
  ManageConnections = 'manage-connections',
  MoonpayExplorerView = 'moonpay-explorer-view',
  NetworkButton = 'network-button',
  Next = 'next',
  Notifications = 'notifications',
  OK = 'ok',
  OnboardingCreateWallet = 'onboarding-create-wallet',
  OnboardingImportBackup = 'onboarding-import-backup',
  OnboardingImportSeedPhrase = 'onboarding-import-seed-phrase',
  OnboardingImportWallet = 'onboarding-import-wallet',
  OnboardingImportWatchedAccount = 'onboarding-import-watched-account',
  OpenSettingsButton = 'open-settings-button',
  QRCodeModalToggle = 'qr-code-modal-toggle',
  Receive = 'receive',
  RecoveryHelpButton = 'recovery-help-button',
  Remove = 'remove',
  RestoreFromICloud = 'restore-from-icloud',
  ReviewSwap = 'review-swap',
  ReviewTransfer = 'review-transfer',
  SearchEtherscanItem = 'search-etherscan-item',
  SearchNFTCollectionItem = 'search-nft-collection-item',
  SearchTokenItem = 'search-token-item',
  SearchWalletItem = 'search-wallet-item',
  SelectColor = 'select-color',
  SelectRecipient = 'select-recipient',
  Send = 'send',
  SetMax = 'set-max',
  Settings = 'settings',
  Skip = 'skip',
  Submit = 'submit',
  Swap = 'swap',
  SwapSettings = 'swap-settings',
  SwitchCurrenciesButton = 'switch-currencies-button',
  TimeFrame1H = 'time-frame-1H',
  TimeFrame1D = 'time-frame-1D',
  TimeFrame1W = 'time-frame-1W',
  TimeFrame1M = 'time-frame-1M',
  TimeFrame1Y = 'time-frame-1Y',
  TokenAddress = 'token-address',
  TokenInputSelector = 'token-input-selector',
  TokenLinkEtherscan = 'token-link-etherscan',
  TokenLinkTwitter = 'token-link-twitter',
  TokenLinkWebsite = 'token-link-website',
  TokenOutputSelector = 'token-output-selector',
  TokenSelectorToggle = 'token-selector-toggle',
  TokenWarningAccept = 'token-warning-accept',
  Unwrap = 'unwrap',
  WCDappSwitchAccount = 'wc-dapp-switch-account',
  WCDappSwitchNetwork = 'wc-dapp-switch-network',
  WCOpenDapp = 'wc-open-dapp',
  WalletCard = 'wallet-card',
  WalletConnectScan = 'wallet-connect-scan',
  WalletQRCode = 'wallet-qr-code',
  WalletSettings = 'WalletSettings',
  Wrap = 'wrap',
  // alphabetize additional values.
}

export const enum MarkNames {}

export enum UserPropertyName {
  AppearanceSetting = 'appearance_setting',
  ActiveWalletAddress = 'active_wallet_address',
  ActiveWalletType = 'active_wallet_type',
  AppOpenAuthMethod = 'app_open_auth_method',
  AppVersion = 'app_version',
  DarkMode = 'is_dark_mode',
  IsCloudBackedUp = 'is_cloud_backed_up',
  IsHideSmallBalancesEnabled = 'is_hide_small_balances_enabled',
  IsHideSpamTokensEnabled = 'is_hide_spam_tokens_enabled',
  IsPushEnabled = 'is_push_enabled',
  TransactionAuthMethod = 'transaction_auth_method',
  WalletSignerAccounts = `wallet_signer_accounts`,
  WalletSignerCount = 'wallet_signer_count',
  WalletViewOnlyCount = 'wallet_view_only_count',
  // alphabetize additional values.
}

// could add PIN in the future
export enum AuthMethod {
  FaceId = 'FaceId',
  None = 'None',
  TouchId = 'TouchId',
  // alphabetize additional values.
}