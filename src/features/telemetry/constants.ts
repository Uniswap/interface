/** High-level event names as used by Firebase */
export enum EventName {
  Impression = 'impression',
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
  CurrencySelect = 'currency-select',
  ImportAccountForm = 'import-account-form',
  NameAccountForm = 'name-account-form',
  QuickDetails = 'quick-details',
  TokenBalance = 'token-balance',
  ExploreTokens = 'explore-tokens',
  NFTCollectionHeader = 'nft-collection-header',
  OnboardingBackup = 'onboarding-backup',
  OnboardingNotifications = 'onboarding-notifications',
  OnboardingSecurity = 'onboarding-security',
  OnboardingWalletCustomize = 'onboarding-wallet-customize',
}

/** Known modals for telemetry purposes. */
export const enum ModalName {
  Account = 'account-modal',
  AddWallet = 'add-wallet-modal',
  ConnectedDapps = 'connected-dapps',
  NetworkSelector = 'network-selector-modal',
  WalletQRCode = 'wallet-qr-code-modal',
  NFTAsset = 'nft-asset',
  TermsModal = 'terms-modal',
  RecipientSelect = 'recipient-select-modal',
  RecoveryWarning = 'recovery-warning',
  ScreenshotWarning = 'screenshot-warning',
  Send = 'send-modal',
  Swap = 'swap-modal',
  SwapWarning = 'swap-warning-modal',
  TokenWarningModal = 'token-warning-modal',
  TransactionActions = 'transaction-actions',
  WalletConnectScan = 'wallet-connect-scan-modal',
  WCSignRequest = 'wc-sign-request-modal',
  RemoveWallet = 'remove-wallet-modal',
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
  Copy = 'copy',
  CreateAccount = 'create-account',
  CurrencySelectorToggle = 'currency-selector-toggle',
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
  NFTAssetItem = 'nft-asset-item',
  NFTAssetViewOnOpensea = 'nft-asset-view-on-opensea',
  NFTCollectionDiscord = 'nft-collection-discord',
  NFTCollectionItem = 'nft-collection-item',
  NFTCollectionTwitter = 'nft-collection-twitter',
  NFTCollectionViewOnOpensea = 'nft-collection-view-on-opensea',
  NFTCollectionWebsite = 'nft-collection-website',
  NavigateBuy = 'navigate-buy',
  NavigateSend = 'navigate-send',
  NavigateSwap = 'navigate-swap',
  NetworkButton = 'network-button',
  Next = 'next',
  Notifications = 'notifications',
  OK = 'ok',
  OnboardingCreateWallet = 'onboarding-create-wallet',
  OnboardingExplore = 'onboarding-explore',
  OnboardingImportBackup = 'onboarding-import-backup',
  OnboardingImportPrivateKey = 'onboarding-import-private-key',
  OnboardingImportSeedPhrase = 'onboarding-import-seed-phrase',
  OnboardingImportWallet = 'onboarding-import-wallet',
  OnboardingImportWatchedAccount = 'onboarding-import-watched-account',
  OpenSettingsButton = 'open-settings-button',
  QRCodeModalToggle = 'qr-code-modal-toggle',
  Remove = 'remove',
  Rename = 'rename',
  Reset = 'reset',
  Restart = 'restart',
  ReviewSwap = 'review-swap',
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
  TokenWarningAccept = 'token-warning-accept',
  SwapQuickDetails = 'swap-quick-details',
  TransactionSummaryHash = 'transaction-summary',
  TryAgain = 'try-again',
  Unwrap = 'unwrap',
  WCDappSwitchNetwork = 'wc-dapp-switch-network',
  WCDappSwitchAccount = 'wc-dapp-switch-account',
  WCOpenDapp = 'wc-open-dapp',
  WCViewDappConnections = 'wc-view-dapp-connections',
  WalletConnectScan = 'wallet-connect-scan',
  WalletSettings = 'WalletSettings',
  Wrap = 'wrap',
}

/**
 * Known actions and their properties.
 * Use destructure assignments to pick properties.
 * @example
 *  const buttonProps = (({ onPress, onLongPress }) => ({ onPress, onLongPress }))(ActionProps)
 */
export const ActionProps = {
  onLongPress: { action: 'long_press' },
  onPress: { action: 'press' },
  onTextInput: { action: 'text_input' },
  // more to be added
}

export type PartialActionProps = Partial<typeof ActionProps>
