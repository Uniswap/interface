import { createSlice, PayloadAction } from '@reduxjs/toolkit'

/**
 * Used to store persisted info about a users interactions with UI.
 * We use this to show conditional UI, usually only for the first time a user views a new feature.
 */
export interface BehaviorHistoryState {
  hasViewedConnectionMigration?: boolean
  hasSkippedUnitagPrompt: boolean
  hasCompletedUnitagsIntroModal: boolean
  hasViewedNotificationsCard?: boolean
  hasUsedExplore: boolean
  backupReminderLastSeenTs?: number
  hasViewedOffRampTooltip: boolean
  hasDismissedBridgingWarning?: boolean
  hasViewedDappRequestBridgingBanner?: {
    [dappUrl: string]: boolean
  }
  smartWalletNudge?: {
    [walletAddress: string]: {
      hasDismissedHomeScreenNudge: boolean
    }
  }
  /**
   * Whether the user has copied their private keys via the view private keys screen during
   * a restoration flow.
   */
  hasCopiedPrivateKeys?: boolean
}

export const initialBehaviorHistoryState: BehaviorHistoryState = {
  hasViewedConnectionMigration: false,
  hasSkippedUnitagPrompt: false,
  hasCompletedUnitagsIntroModal: false,
  hasViewedNotificationsCard: false,
  hasUsedExplore: false,
  backupReminderLastSeenTs: undefined,
  hasViewedOffRampTooltip: false,
  hasViewedDappRequestBridgingBanner: {},
  smartWalletNudge: {},
  hasCopiedPrivateKeys: false,
}

const slice = createSlice({
  name: 'behaviorHistory',
  initialState: initialBehaviorHistoryState,
  reducers: {
    setHasViewedConnectionMigration: (state, action: PayloadAction<boolean>) => {
      state.hasViewedConnectionMigration = action.payload
    },
    setHasSkippedUnitagPrompt: (state, action: PayloadAction<boolean>) => {
      state.hasSkippedUnitagPrompt = action.payload
    },
    setHasCompletedUnitagsIntroModal: (state, action: PayloadAction<boolean>) => {
      state.hasCompletedUnitagsIntroModal = action.payload
    },
    setHasUsedExplore: (state, action: PayloadAction<boolean>) => {
      state.hasUsedExplore = action.payload
    },
    setBackupReminderLastSeenTs: (state, action: PayloadAction<number | undefined>) => {
      state.backupReminderLastSeenTs = action.payload
    },
    setHasViewedOffRampTooltip: (state, action: PayloadAction<boolean>) => {
      state.hasViewedOffRampTooltip = action.payload
    },
    setHasViewedNotificationsCard: (state, action: PayloadAction<boolean>) => {
      state.hasViewedNotificationsCard = action.payload
    },
    setHasViewedDappRequestBridgingBanner: (state, action: PayloadAction<{ dappUrl: string; hasViewed: boolean }>) => {
      state.hasViewedDappRequestBridgingBanner ??= {}
      state.hasViewedDappRequestBridgingBanner[action.payload.dappUrl] = action.payload.hasViewed
    },
    setHasDismissedSmartWalletHomeScreenNudge: (
      state,
      action: PayloadAction<{ walletAddress: string; hasDismissed: boolean }>,
    ) => {
      state.smartWalletNudge ??= {}
      state.smartWalletNudge[action.payload.walletAddress] ??= {
        hasDismissedHomeScreenNudge: action.payload.hasDismissed,
      }
    },
    // Should only be used for testing
    resetWalletBehaviorHistory: (_state, _action: PayloadAction) => {
      return {
        ...initialBehaviorHistoryState,
      }
    },
    setHasCopiedPrivateKeys: (state, action: PayloadAction<boolean>) => {
      state.hasCopiedPrivateKeys = action.payload
    },
  },
})

export const {
  setHasViewedConnectionMigration,
  setHasSkippedUnitagPrompt,
  setHasCompletedUnitagsIntroModal,
  setHasUsedExplore,
  setBackupReminderLastSeenTs,
  setHasViewedOffRampTooltip,
  setHasViewedDappRequestBridgingBanner,
  resetWalletBehaviorHistory,
  setHasViewedNotificationsCard,
  setHasDismissedSmartWalletHomeScreenNudge,
  setHasCopiedPrivateKeys,
} = slice.actions

export const behaviorHistoryReducer = slice.reducer
