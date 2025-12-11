import { isStale, ONE_DAY_MS } from 'utilities/src/time/time'
import { WalletState } from 'wallet/src/state/walletReducer'

export const selectHasSkippedUnitagPrompt = (state: WalletState): boolean =>
  state.behaviorHistory.hasSkippedUnitagPrompt

export const selectHasCompletedUnitagsIntroModal = (state: WalletState): boolean =>
  state.behaviorHistory.hasCompletedUnitagsIntroModal

export const selectBackupReminderLastSeenTs = (state: WalletState): number | undefined =>
  state.behaviorHistory.backupReminderLastSeenTs

export const selectHasUsedExplore = (state: WalletState): boolean => state.behaviorHistory.hasUsedExplore

export const selectHasViewedBridgedAssetsCard = (state: WalletState): boolean =>
  state.behaviorHistory.hasViewedBridgedAssetsCard ?? false

export const selectHasViewedBridgedAssetsV2Card = (state: WalletState): boolean =>
  state.behaviorHistory.hasViewedBridgedAssetsV2Card ?? false

export const selectHasViewedOffRampTooltip = (state: WalletState): boolean =>
  state.behaviorHistory.hasViewedOffRampTooltip

export const selectHasViewedNotificationsCard = (state: WalletState): boolean =>
  state.behaviorHistory.hasViewedNotificationsCard ?? false

export const selectHasViewedDappRequestBridgingBanner = (state: WalletState, dappUrl: string): boolean =>
  state.behaviorHistory.hasViewedDappRequestBridgingBanner?.[dappUrl] ?? false

export const selectHasViewedConnectionMigration = (state: WalletState): boolean =>
  state.behaviorHistory.hasViewedConnectionMigration ?? false

export const selectHasCopiedPrivateKeys = (state: WalletState): boolean =>
  state.behaviorHistory.hasCopiedPrivateKeys ?? false

export const selectHasDismissedSmartWalletHomeScreenNudge = (state: WalletState, walletAddress: string): boolean => {
  if (selectIsAllSmartWalletNudgesDisabled(state, walletAddress)) {
    return true
  }

  return state.behaviorHistory.smartWalletNudge?.[walletAddress]?.hasDismissedHomeScreenNudge ?? false
}

// eslint-disable-next-line max-params
export const selectHasShownEip5792Nudge = (state: WalletState, walletAddress: string, dappUrl: string): boolean => {
  if (selectIsAllSmartWalletNudgesDisabled(state, walletAddress)) {
    return true
  }

  return state.behaviorHistory.smartWalletNudge?.[walletAddress]?.dappUrlToHasShownNudge?.[dappUrl] ?? false
}

export const selectIsAllSmartWalletNudgesDisabled = (state: WalletState, walletAddress: string): boolean =>
  state.behaviorHistory.smartWalletNudge?.[walletAddress]?.isAllSmartWalletNudgesDisabled ?? false

const MAX_NUDGES: number = 2
const NUDGE_INTERVAL: number = ONE_DAY_MS * 14 // 2 weeks if you're bad at math

export const selectShouldShowPostSwapNudge = (state: WalletState, walletAddress: string): boolean => {
  const smartWalletNudgeInfo = state.behaviorHistory.smartWalletNudge?.[walletAddress]

  if (!smartWalletNudgeInfo) {
    return true
  }

  if (selectIsAllSmartWalletNudgesDisabled(state, walletAddress)) {
    return false
  }

  const { lastPostSwapNudge, numPostSwapNudges } = smartWalletNudgeInfo

  if (!lastPostSwapNudge) {
    return true
  }

  return isStale(lastPostSwapNudge, NUDGE_INTERVAL) && (numPostSwapNudges || 0) < MAX_NUDGES
}

export const selectHasSeenCreatedSmartWalletModal = (state: WalletState): boolean =>
  state.behaviorHistory.hasSeenSmartWalletCreatedWalletModal ?? false

export const selectHasDismissedMonadAnnouncement = (state: WalletState): boolean =>
  state.behaviorHistory.hasDismissedMonadAnnouncement ?? false

export const selectHasDismissedNoAppFeesAnnouncement = (state: WalletState): boolean =>
  state.behaviorHistory.hasDismissedNoAppFeesAnnouncement ?? false
