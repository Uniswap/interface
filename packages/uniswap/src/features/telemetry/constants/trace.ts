import {
  InterfaceElementName,
  InterfaceModalName,
  InterfacePageName,
  InterfaceSectionName,
} from '@uniswap/analytics-events'
import { OnboardingCardLoggingName } from 'uniswap/src/features/telemetry/types'

export const ModalName = {
  AccountEdit: 'account-edit-modal',
  AccountEditLabel: 'account-edit--label-modal',
  AccountSwitcher: 'account-switcher-modal',
  AcrossRoutingInfo: 'across-routing-info-modal',
  AddLiquidity: 'add-liquidity',
  AddWallet: 'add-wallet-modal',
  BackupReminder: 'backup-reminder-modal',
  BackupReminderWarning: 'backup-reminder-warning-modal',
  BlockedAddress: 'blocked-address',
  BridgingWarning: 'bridging-warning-modal',
  BuyNativeToken: 'buy-native-token-modal',
  ChooseProfilePhoto: 'choose-profile-photo-modal',
  CloudBackupInfo: 'cloud-backup-info-modal',
  CreatePosition: 'create-position-modal',
  DappRequest: 'dapp-request',
  ENSClaimPeriod: 'ens-claim-period',
  EnterPassword: 'enter-password-modal',
  EstimatedTimeInfo: 'estimated-time-info-modal',
  ExchangeTransferModal: 'exchange-transfer-modal',
  Experiments: 'experiments',
  Explore: 'explore-modal',
  FaceIDWarning: 'face-id-warning',
  FeeClaim: 'fee-claim-modal',
  FeeTierSearch: 'fee-tier-search-modal',
  FOTInfo: 'fee-on-transfer',
  FiatCurrencySelector: 'fiat-currency-selector',
  FiatOnRampAggregator: 'fiat-on-ramp-aggregator',
  FiatOnRampCountryList: 'fiat-on-ramp-country-list',
  FiatOnRampTokenSelector: 'fiat-on-ramp-token-selector',
  ForceUpgradeModal: 'force-upgrade-modal',
  ForgotPassword: 'forgot-password',
  FundWallet: 'fund-wallet',
  KoreaCexTransferInfoModal: 'korea-cex-transfer-info-modal',
  HiddenTokenInfoModal: 'hidden-token-info-modal',
  HiddenNFTInfoModal: 'hidden-nft-info-modal',
  Legal: 'legal',
  LanguageSelector: 'language-selector-modal',
  MigrateLiquidity: 'migrate-liquidity',
  NewAddressWarning: 'new-address-warning-modal',
  NetworkFeeInfo: 'network-fee-info',
  NetworkSelector: 'network-selector-modal',
  NftCollection: 'nft-collection',
  OnDeviceRecoveryConfirmation: 'on-device-recovery-confirmation',
  OtpInputExpired: 'otp-input-expired',
  OtpScanInput: 'otp-scan-input',
  QRCodeNetworkInfo: 'qr-code-network-info',
  QueuedOrderModal: 'queued-order-modal',
  RecipientSelectErc20Warning: 'recipient-select-erc20-warning',
  RecipientSelectNewWarning: 'recipient-select-new-warning',
  RecipientSelectSelfSendWarning: 'recipient-select-self-send-warning',
  RecipientSelectSmartContractWarning: 'recipient-select-smart-contract-warning',
  RecipientSelectViewOnlyWarning: 'recipient-select-view-only-warning',
  ReceiveCryptoModal: 'receive-crypto-modal',
  RecoverySpeedBump: 'recovery-speed-bump',
  RemoveLiquidity: 'remove-liquidity',
  RemoveWallet: 'remove-wallet-modal',
  RestoreWallet: 'restore-wallet-modal',
  RemoveSeedPhraseWarningModal: 'remove-seed-phrase-warning-modal',
  Scantastic: 'scantastic',
  ScreenshotWarning: 'screenshot-warning',
  Send: 'send-modal',
  SeedPhraseWarningModal: 'seed-phrase-warning-modal',
  SendWarning: 'send-warning-modal',
  SendReview: 'send-review-modal',
  SlippageInfo: 'slippage-info-modal',
  StorageWarning: 'storage-warning-modal',
  Swap: 'swap-modal',
  SwapError: 'swap-error-modal',
  SwapReview: 'swap-review-modal',
  SwapSettings: 'swap-settings-modal',
  SwapWarning: 'swap-warning-modal',
  SwapProtection: 'swap-protection-modal',
  TestnetMode: 'testnet-mode-modal',
  TokenSelector: 'token-selector',
  TokenWarningModal: 'token-warning-modal',
  TooltipContent: 'tooltip-content',
  TransactionActions: 'transaction-actions',
  TransactionDetails: 'transaction-details',
  UniswapXInfo: 'uniswapx-info-modal',
  UnitagsChange: 'unitags-change-modal',
  UnitagsChangeConfirm: 'unitags-change-confirm-modal',
  UnitagsDelete: 'unitags-delete-modal',
  UnitagsIntro: 'unitags-intro-modal',
  UniconsV2: 'unicons-v2-intro-modal',
  UniconsDevModal: 'unicons-dev-modal',
  UwULinkErc20SendModal: 'uwulink-erc20-send-modal',
  ViewSeedPhraseWarning: 'view-seed-phrase-warning',
  ViewOnlyExplainer: 'view-only-explainer-modal',
  WalletConnectScan: 'wallet-connect-scan-modal',
  WCDappConnectedNetworks: 'wc-dapp-connected-networks-modal',
  WCPendingConnection: 'wc-pending-connection-modal',
  WCSignRequest: 'wc-sign-request-modal',
  WCViewOnlyWarning: 'wc-view-only-warning-modal',
  // alphabetize additional values.
} as const

export type ModalNameType = (typeof ModalName)[keyof typeof ModalName] | InterfaceModalName

/**
 * Possible names for the telement property in TraceContext
 */
export const ElementName = {
  AcceptNewRate: 'accept-new-rate',
  AccountCard: 'account-card',
  AddManualBackup: 'add-manual-backup',
  AddViewOnlyWallet: 'add-view-only-wallet',
  AddCloudBackup: 'add-cloud-backup',
  AlreadyHaveWalletSignIn: 'already-have-wallet-sign-in',
  BackButton: 'back-button',
  Buy: 'buy',
  BuyNativeTokenButton: 'buy-native-token-button',
  BridgeNativeTokenButton: 'bridge-native-token-button',
  Cancel: 'cancel',
  ChainEthereum: 'chain-ethereum',
  ChainSepolia: 'chain-sepolia',
  ChainOptimism: 'chain-optimism',
  ChainArbitrum: 'chain-arbitrum',
  ChainPolygon: 'chain-polygon',
  ChainCelo: 'chain-celo',
  ChainBNB: 'chain-bnb',
  ChainAvalanche: 'chain-avalanche',
  ChainBase: 'chain-base',
  ChainBlast: 'chain-blast',
  ChainWorldChain: 'chain-world-chain',
  ChainZora: 'chain-zora',
  ChainZkSync: 'chain-zksync',
  ChooseInputToken: 'choose-input-token',
  ChooseOutputToken: 'choose-output-token',
  Confirm: 'confirm',
  Continue: 'continue',
  Copy: 'copy',
  CopyAddress: 'copy-address',
  CreateAccount: 'create-account',
  EmptyStateBuy: 'empty-state-buy',
  EmptyStateImport: 'empty-state-get-import',
  EmptyStateReceive: 'empty-state-receive',
  Enable: 'enable',
  EtherscanView: 'etherscan-view',
  ExtensionPopupOpenButton: 'extension-popup-open-button',
  FiatOnRampTokenSelector: 'fiat-on-ramp-token-selector',
  FiatOnRampWidgetButton: 'fiat-on-ramp-widget-button',
  FiatOnRampCountryPicker: 'fiat-on-ramp-country-picker',
  GetHelp: 'get-help',
  ImportAccount: 'import-account',
  LimitOrderButton: 'limit-order-button',
  MaybeLaterButton: 'maybe-later-button',
  MoonpayExplorerView: 'moonpay-explorer-view',
  NetworkButton: 'network-button',
  Next: 'next',
  NftItem: 'nft-item',
  OK: 'ok',
  OnboardingIntroCardFundWallet: 'onboarding-intro-card-fund-wallet',
  OnboardingImportBackup: 'onboarding-import-backup',
  OnboardingImportSeedPhrase: 'onboarding-import-seed-phrase',
  OnDeviceRecoveryImportOther: 'on-device-recovery-import-other',
  OnDeviceRecoveryWallet: 'on-device-recovery-wallet',
  OnDeviceRecoveryModalCancel: 'on-device-recovery-modal-cancel',
  OnDeviceRecoveryModalConfirm: 'on-device-recovery-modal-confirm',
  OpenCameraRoll: 'open-camera-roll',
  OpenNftsList: 'open-nfts-list',
  QRCodeModalToggle: 'qr-code-modal-toggle',
  Receive: 'receive',
  RecoveryHelpButton: 'recovery-help-button',
  Remove: 'remove',
  RestoreFromCloud: 'restore-from-cloud',
  Sell: 'sell',
  Send: 'send',
  SetMaxInput: 'set-max-input',
  SetMaxOutput: 'set-max-output',
  Skip: 'skip',
  Swap: 'swap',
  SwapFormHeader: 'swap-form-header',
  SwapReview: 'swap-review',
  SendReview: 'send-review',
  SwapRoutingPreferenceDefault: 'swap-routing-preference-default',
  SwapRoutingPreferenceUniswapX: 'swap-routing-preference-UniswapX',
  SwapRoutingPreferenceV2: 'swap-routing-preference-v2',
  SwapRoutingPreferenceV3: 'swap-routing-preference-v3',
  SwapRoutingPreferenceV4: 'swap-routing-preference-v4',
  SwitchCurrenciesButton: 'switch-currencies-button',
  TimeFrame1H: 'time-frame-1H',
  TimeFrame1D: 'time-frame-1D',
  TimeFrame1W: 'time-frame-1W',
  TimeFrame1M: 'time-frame-1M',
  TimeFrame1Y: 'time-frame-1Y',
  TimeFrameAll: 'time-frame-All',
  TokenAddress: 'token-address',
  TokenInputSelector: 'token-input-selector',
  TokenItem: 'token-item',
  TokenLinkEtherscan: 'token-link-etherscan',
  TokenLinkTwitter: 'token-link-twitter',
  TokenLinkWebsite: 'token-link-website',
  TokenOutputSelector: 'token-output-selector',
  Unwrap: 'unwrap',
  WalletCard: 'wallet-card',
  WalletConnectScan: 'wallet-connect-scan',
  WalletQRCode: 'wallet-qr-code',
  Wrap: 'wrap',
  // alphabetize additional values.
} as const

export type ElementNameType =
  | (typeof ElementName)[keyof typeof ElementName]
  | InterfaceElementName
  | OnboardingCardLoggingName

/**
 * Possible names for the section property in TraceContext
 */
export const SectionName = {
  CurrencyInputPanel: 'currency-input-panel',
  CurrencyOutputPanel: 'currency-output-panel',
  ExploreFavoriteTokensSection: 'explore-favorite-tokens-section',
  ExploreSearch: 'explore-search',
  ExploreTopTokensSection: 'explore-top-tokens-section',
  HomeActivityTab: 'home-activity-tab',
  HomeExploreTab: 'home-explore-tab',
  HomeFeedTab: 'home-feed-tab',
  HomeNFTsTab: 'home-nfts-tab',
  HomeTokensTab: 'home-tokens-tab',
  ImportAccountForm: 'import-account-form',
  ProfileActivityTab: 'profile-activity-tab',
  ProfileNftsTab: 'profile-nfts-tab',
  ProfileTokensTab: 'profile-tokens-tab',
  SwapForm: 'swap-form',
  SwapPending: 'swap-pending',
  SwapReview: 'swap-review',
  TokenSelector: 'token-selector',
  TokenDetails: 'token-details',

  // These name / values don't match because we refactored code to use "send", but wanted to preserve old names for dashboards
  SendForm: 'transfer-form',
  SendReview: 'transfer-review',
  SendRecipientSelectFullScreen: 'send-recipient-select',

  ChainSelector: 'chain-selector',

  // alphabetize additional values.
} as const

export type SectionNameType = (typeof SectionName)[keyof typeof SectionName] | InterfaceSectionName

export const InterfacePageNameLocal = {
  Send: 'send-page',
  Limit: 'limit-page',
  Buy: 'buy-page',
}

export type InterfacePageNameType =
  | (typeof InterfacePageNameLocal)[keyof typeof InterfacePageNameLocal]
  | InterfacePageName
