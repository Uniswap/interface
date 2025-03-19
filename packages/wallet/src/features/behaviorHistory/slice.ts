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
    // Should only be used for testing
    resetWalletBehaviorHistory: (_state, _action: PayloadAction) => {
      return {
        ...initialBehaviorHistoryState,
      }
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
} = slice.actions

export const behaviorHistoryReducer = slice.reducer
