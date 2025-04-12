import { WalletState } from 'wallet/src/state/walletReducer'

export const selectHasSkippedUnitagPrompt = (state: WalletState): boolean =>
  state.behaviorHistory.hasSkippedUnitagPrompt

export const selectHasCompletedUnitagsIntroModal = (state: WalletState): boolean =>
  state.behaviorHistory.hasCompletedUnitagsIntroModal

export const selectBackupReminderLastSeenTs = (state: WalletState): number | undefined =>
  state.behaviorHistory.backupReminderLastSeenTs

export const selectHasUsedExplore = (state: WalletState): boolean => state.behaviorHistory.hasUsedExplore

export const selectHasViewedOffRampTooltip = (state: WalletState): boolean =>
  state.behaviorHistory.hasViewedOffRampTooltip

export const selectHasViewedNotificationsCard = (state: WalletState): boolean =>
  state.behaviorHistory.hasViewedNotificationsCard ?? false

export const selectHasViewedDappRequestBridgingBanner = (state: WalletState, dappUrl: string): boolean =>
  state.behaviorHistory.hasViewedDappRequestBridgingBanner?.[dappUrl] ?? false

export const selectHasViewedConnectionMigration = (state: WalletState): boolean =>
  state.behaviorHistory.hasViewedConnectionMigration ?? false
