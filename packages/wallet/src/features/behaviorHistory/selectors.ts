import { WalletState } from 'wallet/src/state/walletReducer'

export const selectCreatedOnboardingRedesignAccount = (state: WalletState): boolean =>
  state.behaviorHistory.createdOnboardingRedesignAccount

export const selectHasSkippedUnitagPrompt = (state: WalletState): boolean =>
  state.behaviorHistory.hasSkippedUnitagPrompt

export const selectHasCompletedUnitagsIntroModal = (state: WalletState): boolean =>
  state.behaviorHistory.hasCompletedUnitagsIntroModal

export const selectHasViewedWelcomeWalletCard = (state: WalletState): boolean =>
  state.behaviorHistory.hasViewedWelcomeWalletCard

export const selectBackupReminderLastSeenTs = (state: WalletState): number | undefined =>
  state.behaviorHistory.backupReminderLastSeenTs

export const selectHasUsedExplore = (state: WalletState): boolean => state.behaviorHistory.hasUsedExplore

export const selectHasViewedOffRampTooltip = (state: WalletState): boolean =>
  state.behaviorHistory.hasViewedOffRampTooltip

export const selectHasViewedDappRequestBridgingBanner = (state: WalletState, dappUrl: string): boolean =>
  state.behaviorHistory.hasViewedDappRequestBridgingBanner?.[dappUrl] ?? false
