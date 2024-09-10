import { createSlice, PayloadAction } from '@reduxjs/toolkit'

/**
 * Used to store persisted info about a users interactions with UI.
 * We use this to show conditional UI, usually only for the first time a user views a new feature.
 */
export interface BehaviorHistoryState {
  hasSkippedUnitagPrompt: boolean
  hasCompletedUnitagsIntroModal: boolean
  hasViewedWelcomeWalletCard: boolean
  hasUsedExplore: boolean
  backupReminderLastSeenTs?: number
}

export const initialBehaviorHistoryState: BehaviorHistoryState = {
  hasSkippedUnitagPrompt: false,
  hasCompletedUnitagsIntroModal: false,
  hasViewedWelcomeWalletCard: false,
  hasUsedExplore: false,
  backupReminderLastSeenTs: undefined,
}

const slice = createSlice({
  name: 'behaviorHistory',
  initialState: initialBehaviorHistoryState,
  reducers: {
    setHasSkippedUnitagPrompt: (state, action: PayloadAction<boolean>) => {
      state.hasSkippedUnitagPrompt = action.payload
    },
    setHasCompletedUnitagsIntroModal: (state, action: PayloadAction<boolean>) => {
      state.hasCompletedUnitagsIntroModal = action.payload
    },
    setHasViewedWelcomeWalletCard: (state, action: PayloadAction<boolean>) => {
      state.hasViewedWelcomeWalletCard = action.payload
    },
    setHasUsedExplore: (state, action: PayloadAction<boolean>) => {
      state.hasUsedExplore = action.payload
    },
    setBackupReminderLastSeenTs: (state, action: PayloadAction<number | undefined>) => {
      state.backupReminderLastSeenTs = action.payload
    },
  },
})

export const {
  setHasSkippedUnitagPrompt,
  setHasCompletedUnitagsIntroModal,
  setHasViewedWelcomeWalletCard,
  setHasUsedExplore,
  setBackupReminderLastSeenTs,
} = slice.actions

export const behaviorHistoryReducer = slice.reducer
