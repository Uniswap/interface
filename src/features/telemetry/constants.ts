/**
 * Event names that can occur in this application
 *
 * Subject to change as new features are added and new events are defined and logged.
 */
export enum EventName {
  AppLoaded = 'app-loaded',
  Impression = 'impression',
  MarkMeasure = 'mark-measure',
  OnboardingCompleted = 'onboarding-completed',
  Transaction = 'transaction',
  UserEvent = 'user-event',
  WalletAdded = 'wallet-added',
  // alphabetize additional values.
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
  ExploreTokensTab = 'explore-tokens-tab',
  ExploreWalletsTab = 'explore-wallets-tab',
  HomeNFTsTab = 'home-nfts-tab',
  HomeTokensTab = 'home-tokens-tab',
  ImportAccountForm = 'import-account-form',
  ProfileActivityTab = 'profile-activity-tab',
  ProfileNftsTab = 'profile-nfts-tab',
  ProfileTokensTab = 'profile-tokens-tab',
  Sidebar = 'sidebar',
  // alphabetize additional values.
}

/** Known modals for telemetry purposes. */
export const enum ModalName {
  Account = 'account-modal',
  AddWallet = 'add-wallet-modal',
  BlockedAddress = 'blocked-address',
  Experiments = 'experiments',
  FaceIDWarning = 'face-id-warning',
  ForceUpgradeModal = 'force-upgrade-modal',
  ICloudBackupInfo = 'icloud-backup-info-modal',
  NetworkSelector = 'network-selector-modal',
  NftCollection = 'nft-collection',
  RecoveryWarning = 'recovery-warning',
  RemoveWallet = 'remove-wallet-modal',
  ScreenshotWarning = 'screenshot-warning',
  Send = 'send-modal',
  SendWarning = 'send-warning-modal',
  Swap = 'swap-modal',
  SwapWarning = 'swap-warning-modal',
  TokenWarningModal = 'token-warning-modal',
  TooltipContent = 'tooltip-content',
  TransactionActions = 'transaction-actions',
  ViewSeedPhraseWarning = 'view-seed-phrase-warning',
  WCSignRequest = 'wc-sign-request-modal',
  WCSwitchChainRequest = 'wc-switch-chain-request-modal',
  WalletConnectScan = 'wallet-connect-scan-modal',
  // alphabetize additional values.
}

/**
 * Known element names for telemetry purposes.
 * Use to identify low-level components given a TraceContext
 */

export const enum ElementName {
  AccountCard = 'account-card',
  AddManualBackup = 'add-manual-backup',
  AddViewOnlyWallet = 'add-view-only-wallet',
  AddiCloudBackup = 'add-icloud-backup',
  Back = 'back',
  Cancel = 'cancel',
  Confirm = 'confirm',
  Continue = 'continue',
  Copy = 'copy',
  CreateAccount = 'create-account',
  Disconnect = 'disconnect',
  Edit = 'edit',
  Enable = 'enable',
  EtherscanView = 'etherscan-view',
  GetHelp = 'get-help',
  ImportAccount = 'import',
  Manage = 'manage',
  ManageConnections = 'manage-connections',
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
  Remove = 'remove',
  ReviewSwap = 'review-swap',
  ReviewTransfer = 'review-transfer',
  SearchEtherscanItem = 'search-etherscan-item',
  SearchTokenItem = 'search-token-item',
  SearchWalletItem = 'search-wallet-item',
  SelectColor = 'select-color',
  SelectRecipient = 'select-recipient',
  Send = 'send',
  Settings = 'settings',
  Skip = 'skip',
  Submit = 'submit',
  Swap = 'swap',
  TokenSelectorToggle = 'token-selector-toggle',
  TokenWarningAccept = 'token-warning-accept',
  Unwrap = 'unwrap',
  WCDappSwitchAccount = 'wc-dapp-switch-account',
  WCDappSwitchNetwork = 'wc-dapp-switch-network',
  WCOpenDapp = 'wc-open-dapp',
  WalletCard = 'wallet-card',
  WalletConnectScan = 'wallet-connect-scan',
  WalletSettings = 'WalletSettings',
  Wrap = 'wrap',
  // alphabetize additional values.
}

export const enum MarkNames {
  AppStartup = 'AppStartup',
  // alphabetize additional values.
}

/**
 * Context to pass down to our logMessage and logExceptions methods.
 *
 * This can be any context you think its helpful to identify
 * where these methods are called from (e.g. component name, function name, file name).
 */
export const enum LogContext {
  Analytics = 'Analytics',
  CloudBackup = 'CloudBackup',
  ErrorBoundary = 'ErrorBoundary',
  Experiments = 'Experiments',
  ForceUpgrade = 'ForceUpgrade',
  ImageUtils = 'ImageUtils',
  Marks = 'Marks',
  OpenUri = 'OpenUri',
  ProviderManager = 'ProviderManager',
  SecurityConcern = 'SecurityConcern',
  Share = 'Share',
  ValidateAddress = 'ValidateAddress',
  // alphabetize additional values.
}

export enum UserPropertyName {
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

/**
 * Known components' events that trigger callbacks.
 *
 * e.g OnFocus, OnLongPress, OnSubmit, etc.
 *
 * @example
 *  <TraceEvent events={[ReactNativeEvent.onPress]} element={name}>
 */
export enum ReactNativeEvent {
  OnPress = 'onPress',
  // alphabetize additional values.
}
