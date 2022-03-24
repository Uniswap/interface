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
  NFTCollectionHeader = 'nft-collection-header',
}

/** Known modals for telemetry purposes. */
export const enum ModalName {
  Account = 'account-modal',
  NetworkSelector = 'network-selector-modal',
  WalletQRCode = 'wallet-qr-code-modal',
  NFTAsset = 'nft-asset',
}

/**
 * Known element names for telemetry purposes.
 * Use to identify low-level components given a TraceContext
 */
export const enum ElementName {
  AccountCard = 'account-card',
  ApplyThemeFromNFT = 'apply-theme-from-nft',
  Back = 'back',
  BuyToken = 'buy-token',
  ClearSearch = 'clear-search',
  Confirm = 'confirm',
  Copy = 'copy',
  CreateAccount = 'create-account',
  CurrencySelectorToggle = 'currency-selector-toggle',
  Done = 'done',
  Edit = 'edit',
  EditCancel = 'edit-cancel',
  FavoritesFilter = 'favorites-filter',
  ImportAccount = 'import',
  Manage = 'manage',
  NetworkButton = 'network-button',
  Notifications = 'notifications',
  QRCodeModalToggle = 'qr-code-modal-toggle',
  SwapQuickDetails = 'swap-quick-details',
  Remove = 'remove',
  Rename = 'rename',
  Restart = 'restart',
  Reset = 'reset',
  SellToken = 'sell-token',
  Settings = 'settings',
  Submit = 'submit',
  Swap = 'swap',
  SwapArrow = 'swap-arrow',
  TabBarSwap = 'tab-bar-swap',
  TransactionSummaryHash = 'transaction-summary',
  TryAgain = 'try-again',
  Unwrap = 'unwrap',
  WalletConnectScan = 'wallet-connect-scan',
  Wrap = 'wrap',
  NFTAssetItem = 'nft-asset-item',
  NFTCollectionItem = 'nft-collection-item',
  NFTAssetViewOnOpensea = 'nft-asset-view-on-opensea',
  NFTCollectionViewOnOpensea = 'nft-collection-view-on-opensea',
  NFTCollectionDiscord = 'nft-collection-discord',
  NFTCollectionTwitter = 'nft-collection-twitter',
  NFTCollectionWebsite = 'nft-collection-website',
  OnboardingCreateWallet = 'onboarding-create-wallet',
  OnboardingImportWallet = 'onboarding-import-wallet',
  OnboardingExplore = 'onboarding-explore',
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
