/**
 * Event names that can occur in this application
 *
 * Subject to change as new features are added and new events are defined and logged.
 */
export enum EventName {
  AppLoaded = 'app-loaded',
  Impression = 'impression',
  MarkMeasure = 'mark-measure',
  Transaction = 'transaction',
  UserEvent = 'user-event',
}

/**
 * Known sections to provide telemetry context.
 * Can help disambiguate low-level elements that may share a name.
 * For example, a `back` button in a modal will have the same
 * `elementName`, but a different `section`.
 */
export const enum SectionName {
  AccountCard = 'account-card',
  CurrencyInputPanel = 'currency-input-panel',
  CurrencyOutputPanel = 'currency-output-panel',
  ExploreTokensTab = 'explore-tokens-tab',
  ExploreWalletsTab = 'explore-wallets-tab',
  HomeNFTsTab = 'home-nfts-tab',
  HomeTokensTab = 'home-tokens-tab',
  ImportAccountForm = 'import-account-form',
  NameAccountForm = 'name-account-form',
  NFTCollectionModal = 'nft-collection-modal',
  OnboardingBackup = 'onboarding-backup',
  OnboardingNotifications = 'onboarding-notifications',
  OnboardingSecurity = 'onboarding-security',
  OnboardingWalletCustomize = 'onboarding-wallet-customize',
  ProfileActivityTab = 'profile-activity-tab',
  ProfileNftsTab = 'profile-nfts-tab',
  ProfileTokensTab = 'profile-tokens-tab',
  Sidebar = 'sidebar',
  TokenBalance = 'token-balance',
  TokenSelect = 'token-select',
}

/** Known modals for telemetry purposes. */
export const enum ModalName {
  Account = 'account-modal',
  AddWallet = 'add-wallet-modal',
  BlockedAddress = 'blocked-address',
  ConnectedDapps = 'connected-dapps',
  Experiments = 'experiments',
  ForceUpgradeModal = 'force-upgrade-modal',
  NetworkSelector = 'network-selector-modal',
  WalletQRCode = 'wallet-qr-code-modal',
  NFTAsset = 'nft-asset',
  TermsModal = 'terms-modal',
  RecoveryWarning = 'recovery-warning',
  FaceIDWarning = 'face-id-warning',
  ICloudBackupInfo = 'icloud-backup-info-modal',
  NftCollection = 'nft-collection',
  ScreenshotWarning = 'screenshot-warning',
  Send = 'send-modal',
  SendWarning = 'send-warning-modal',
  Swap = 'swap-modal',
  SwapWarning = 'swap-warning-modal',
  TokenWarningModal = 'token-warning-modal',
  TooltipContent = 'tooltip-content',
  TransactionActions = 'transaction-actions',
  WalletConnectScan = 'wallet-connect-scan-modal',
  WCSignRequest = 'wc-sign-request-modal',
  WCSwitchChainRequest = 'wc-switch-chain-request-modal',
  RemoveWallet = 'remove-wallet-modal',
  ViewSeedPhraseWarning = 'view-seed-phrase-warning',
}

/**
 * Known element names for telemetry purposes.
 * Use to identify low-level components given a TraceContext
 */

export const enum ElementName {
  AccountCard = 'account-card',
  AddManualBackup = 'add-manual-backup',
  AddiCloudBackup = 'add-icloud-backup',
  AddViewOnlyWallet = 'add-view-only-wallet',
  ApplyThemeFromNFT = 'apply-theme-from-nft',
  Back = 'back',
  BuyToken = 'buy-token',
  Cancel = 'cancel',
  ClearSearch = 'clear-search',
  Confirm = 'confirm',
  Continue = 'continue',
  Copy = 'copy',
  CreateAccount = 'create-account',
  Disconnect = 'disconnect',
  Done = 'done',
  Edit = 'edit',
  EditCancel = 'edit-cancel',
  Enable = 'enable',
  EtherscanView = 'etherscan-view',
  FavoritesFilter = 'favorites-filter',
  GetHelp = 'get-help',
  ImportAccount = 'import',
  Manage = 'manage',
  ManageConnections = 'manage-connections',
  NFTAssetItem = 'nft-asset-item',
  NFTAssetViewOnUniswap = 'nft-asset-view-on-uniswap',
  NFTCollectionDiscord = 'nft-collection-discord',
  NFTCollectionItem = 'nft-collection-item',
  NFTCollectionTwitter = 'nft-collection-twitter',
  NFTCollectionViewOnUniswap = 'nft-collection-view-on-uniswap',
  NFTCollectionWebsite = 'nft-collection-website',
  NavigateBuy = 'navigate-buy',
  NavigateSend = 'navigate-send',
  NavigateSwap = 'navigate-swap',
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
  Rename = 'rename',
  Reset = 'reset',
  Restart = 'restart',
  RetrySwap = 'retry-swap',
  ReviewSwap = 'review-swap',
  ReviewTransfer = 'review-transfer',
  SearchEtherscanItem = 'search-etherscan-item',
  SearchTokenItem = 'search-token-item',
  SearchWalletItem = 'search-wallet-item',
  SelectColor = 'select-color',
  SelectRecipient = 'select-recipient',
  SellToken = 'sell-token',
  Send = 'send',
  Settings = 'settings',
  ShareButton = 'share-button',
  Skip = 'skip',
  Submit = 'submit',
  Swap = 'swap',
  SwapAnyway = 'swap-anyway',
  SwapArrow = 'swap-arrow',
  Switch = 'switch',
  TabBarSwap = 'tab-bar-swap',
  TokenSelectorToggle = 'token-selector-toggle',
  TokenWarningAccept = 'token-warning-accept',
  TransactionSummaryHash = 'transaction-summary',
  TryAgain = 'try-again',
  Unwrap = 'unwrap',
  WCDappSwitchNetwork = 'wc-dapp-switch-network',
  WCDappSwitchAccount = 'wc-dapp-switch-account',
  WCOpenDapp = 'wc-open-dapp',
  WCViewDappConnections = 'wc-view-dapp-connections',
  WalletCard = 'wallet-card',
  WalletConnectScan = 'wallet-connect-scan',
  WalletSettings = 'WalletSettings',
  Wrap = 'wrap',
}

export const enum MarkNames {
  AppStartup = 'AppStartup',
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
  WrappedTokenInfo = 'WrappedTokenInfo',
}

export enum UserPropertyName {
  ActiveWalletAddress = 'active_wallet_address',
  ActiveWalletType = 'active_wallet_type',
  AppOpenAuthMethod = 'app_open_auth_method',
  AppVersion = 'app_version',
  DarkMode = 'is_dark_mode',
  IsCloudBackedUp = 'is_cloud_backed_up',
  IsPushEnabled = 'is_push_enabled',
  TransactionAuthMethod = 'transaction_auth_method',
  WalletSignerCount = 'wallet_signer_count',
  WalletViewOnlyCount = 'wallet_view_only_count',
}

// could add PIN in the future
export enum AuthMethod {
  None = 'None',
  FaceId = 'FaceId',
  TouchId = 'TouchId',
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
  // alphabetize additional events.
}
