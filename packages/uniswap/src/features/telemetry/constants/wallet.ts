import { SharedEventName } from '@uniswap/analytics-events'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants/extension'
import { SwapEventName } from 'uniswap/src/features/telemetry/constants/features'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants/uniswap'
// biome-ignore lint/style/noRestrictedImports: legacy import will be migrated
import type { TestnetModeConfig } from 'utilities/src/telemetry/analytics/analytics'

export enum WalletEventName {
  AppRating = 'App Rating',
  BackupMethodAdded = 'Backup Method Added',
  BackupMethodRemoved = 'Backup Method Removed',
  DappRequestCardClosed = 'DappRequestCardClosed',
  DappRequestCardPressed = 'DappRequestCardPressed',
  ExploreSearchCancel = 'Explore Search Cancel',
  ExternalLinkOpened = 'External Link Opened',
  GasEstimateAccuracy = 'Gas Estimate Accuracy',
  KeyringMissingMnemonic = 'Keyring Missing Mnemonic',
  ModalClosed = 'Modal Closed',
  MismatchAccountSignatureRequestBlocked = 'Mismatch Account Signature Request Blocked',
  NFTVisibilityChanged = 'NFT Visibility Changed',
  NFTsLoaded = 'NFTs Loaded',
  OnboardingIntroCardClosed = 'Onboarding Intro Card Closed',
  OnboardingIntroCardPressed = 'Onboarding Intro Card Pressed',
  OnboardingIntroCardSwiped = 'Onboarding Intro Card Swiped',
  PendingTransactionTimeout = 'Pending Transaction Timeout',
  PerformanceGraphql = 'Performance GraphQL',
  PortfolioBalanceFreshnessLag = 'Portfolio Balance Freshness Lag',
  SendRecipientSelected = 'Send Recipient Selected',
  ShareButtonClicked = 'Share Button Clicked',
  SilentPushReceived = 'Silent Push Received',
  SwapSubmitted = 'Swap Submitted to Provider',
  CancelSubmitted = 'Cancel Submitted to Provider',
  SwapTransactionCancelled = 'Swap Transaction Cancelled',
  TestnetEvent = 'Testnet Event',
  TestnetModeToggled = 'Testnet Mode Toggled',
  TokenVisibilityChanged = 'Token Visibility Changed',
  TransferCompleted = 'Transfer Completed',
  TransferSubmitted = 'Transfer Submitted',
  ViewRecoveryPhrase = 'View Recovery Phrase',
  WalletAdded = 'Wallet Added',
  WalletRemoved = 'Wallet Removed',
  // alphabetize additional values.
}

export const WALLET_TESTNET_CONFIG: TestnetModeConfig = {
  allowlistEvents: [
    SharedEventName.PAGE_VIEWED,
    SharedEventName.ELEMENT_CLICKED,
    UniswapEventName.NetworkFilterSelected,
    UniswapEventName.TokenSelected,
    UniswapEventName.TooltipOpened,
    WalletEventName.ExternalLinkOpened,
    WalletEventName.SwapSubmitted,
    WalletEventName.TransferCompleted,
    WalletEventName.TransferSubmitted,
    SwapEventName.SwapSubmittedButtonClicked,
    SwapEventName.SwapTransactionCompleted,
    SwapEventName.SwapTransactionFailed,
    SwapEventName.SwapQuoteReceived,
    ExtensionEventName.DappChangeChain,
    ExtensionEventName.DappRequest,
  ],
  passthroughAllowlistEvents: [
    ExtensionEventName.DappConnect,
    ExtensionEventName.DappDisconnect,
    ExtensionEventName.DappDisconnectAll,
    ExtensionEventName.DappTroubleConnecting,
  ],
  aggregateEventName: WalletEventName.TestnetEvent,
}
