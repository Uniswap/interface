import { SharedEventName, SwapEventName } from '@uniswap/analytics-events'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants/extension'
// eslint-disable-next-line no-restricted-imports
import { TestnetModeConfig } from 'utilities/src/telemetry/analytics/analytics'

export enum WalletEventName {
  BackupMethodAdded = 'Backup Method Added',
  BackupMethodRemoved = 'Backup Method Removed',
  DappRequestCardPressed = 'DappRequestCardPressed',
  DappRequestCardClosed = 'DappRequestCardClosed',
  GasEstimateAccuracy = 'Gas Estimate Accuracy',
  ExploreSearchCancel = 'Explore Search Cancel',
  ModalClosed = 'Modal Closed',
  NFTVisibilityChanged = 'NFT Visibility Changed',
  NFTsLoaded = 'NFTs Loaded',
  NetworkFilterSelected = 'Network Filter Selected',
  ExternalLinkOpened = 'External Link Opened',
  OnboardingIntroCardSwiped = 'Onboarding Intro Card Swiped',
  OnboardingIntroCardPressed = 'Onboarding Intro Card Pressed',
  OnboardingIntroCardClosed = 'Onboarding Intro Card Closed',
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
    WalletEventName.NetworkFilterSelected,
    WalletEventName.TransferCompleted,
    WalletEventName.TransferSubmitted,
    SharedEventName.PAGE_VIEWED,
    SwapEventName.SWAP_TRANSACTION_COMPLETED,
    SwapEventName.SWAP_TRANSACTION_FAILED,
    ExtensionEventName.DappRequest,
    WalletEventName.SwapSubmitted,
    WalletEventName.TransferSubmitted,
    WalletEventName.TransferCompleted,
  ],
  passthroughAllowlistEvents: [
    ExtensionEventName.DappConnect,
    ExtensionEventName.DappDisconnect,
    ExtensionEventName.DappDisconnectAll,
    ExtensionEventName.DappTroubleConnecting,
  ],
  aggregateEventName: WalletEventName.TestnetEvent,
}
