import { SharedEventName, SwapEventName } from '@uniswap/analytics-events'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants/extension'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants/uniswap'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { TestnetModeConfig } from 'utilities/src/telemetry/analytics/analytics'

export enum WalletEventName {
  AppRating = 'App Rating',
  BackupMethodAdded = 'Backup Method Added',
  BackupMethodRemoved = 'Backup Method Removed',
  DappRequestCardPressed = 'DappRequestCardPressed',
  DappRequestCardClosed = 'DappRequestCardClosed',
  GasEstimateAccuracy = 'Gas Estimate Accuracy',
  ExploreSearchCancel = 'Explore Search Cancel',
  LowNetworkTokenInfoModalOpened = 'Low Network Token Info Modal Opened',
  ModalClosed = 'Modal Closed',
  NFTVisibilityChanged = 'NFT Visibility Changed',
  NFTsLoaded = 'NFTs Loaded',
  NetworkFilterSelected = 'Network Filter Selected',
  ExternalLinkOpened = 'External Link Opened',
  OnboardingIntroCardSwiped = 'Onboarding Intro Card Swiped',
  OnboardingIntroCardPressed = 'Onboarding Intro Card Pressed',
  OnboardingIntroCardClosed = 'Onboarding Intro Card Closed',
  PendingTransactionTimeout = 'Pending Transaction Timeout',
  PerformanceGraphql = 'Performance GraphQL',
  PortfolioBalanceFreshnessLag = 'Portfolio Balance Freshness Lag',
  SendRecipientSelected = 'Send Recipient Selected',
  ShareButtonClicked = 'Share Button Clicked',
  SwapSubmitted = 'Swap Submitted to Provider',
  TestnetEvent = 'Testnet Event',
  TokenVisibilityChanged = 'Token Visibility Changed',
  TestnetModeToggled = 'Testnet Mode Toggled',
  TransferCompleted = 'Transfer Completed',
  TransferSubmitted = 'Transfer Submitted',
  ViewRecoveryPhrase = 'View Recovery Phrase',
  WalletAdded = 'Wallet Added',
  WalletRemoved = 'Wallet Removed',
}

export const WALLET_TESTNET_CONFIG: TestnetModeConfig = {
  allowlistEvents: [
    SharedEventName.PAGE_VIEWED,
    SharedEventName.ELEMENT_CLICKED,
    UniswapEventName.TokenSelected,
    WalletEventName.ExternalLinkOpened,
    WalletEventName.NetworkFilterSelected,
    WalletEventName.SwapSubmitted,
    WalletEventName.TransferCompleted,
    WalletEventName.TransferSubmitted,
    SwapEventName.SWAP_SUBMITTED_BUTTON_CLICKED,
    SwapEventName.SWAP_TRANSACTION_COMPLETED,
    SwapEventName.SWAP_TRANSACTION_FAILED,
    SwapEventName.SWAP_QUOTE_RECEIVED,
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
