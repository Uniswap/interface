import { createSlice, PayloadAction } from '@reduxjs/toolkit'

/**
 * Used to store persisted info about a users interactions with UI.
 * We use this to show conditional UI, usually only for the first time a user views a new feature.
 */
export interface BehaviorHistoryState {
  createdOnboardingRedesignAccount: boolean
  hasSkippedUnitagPrompt: boolean
  hasCompletedUnitagsIntroModal: boolean
  hasViewedWelcomeWalletCard: boolean
  hasUsedExplore: boolean
  backupReminderLastSeenTs?: number
  hasViewedOffRampTooltip: boolean
  hasDismissedBridgingWarning?: boolean
  hasViewedDappRequestBridgingBanner?: {
    [dappUrl: string]: boolean
  }
}

export const initialBehaviorHistoryState: BehaviorHistoryState = {
  createdOnboardingRedesignAccount: false,
  hasSkippedUnitagPrompt: false,
  hasCompletedUnitagsIntroModal: false,
  hasViewedWelcomeWalletCard: false,
  hasUsedExplore: false,
  backupReminderLastSeenTs: undefined,
  hasViewedOffRampTooltip: false,
  hasViewedDappRequestBridgingBanner: {},
}
const slice = createSlice({
  name: 'behaviorHistory',
  initialState: initialBehaviorHistoryState,
  reducers: {
    setCreatedOnboardingRedesignAccount: (state, action: PayloadAction<boolean>) => {
      state.createdOnboardingRedesignAccount = action.payload
    },
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
    setHasViewedOffRampTooltip: (state, action: PayloadAction<boolean>) => {
      state.hasViewedOffRampTooltip = action.payload
    },
    setHasViewedDappRequestBridgingBanner: (state, action: PayloadAction<{ dappUrl: string; hasViewed: boolean }>) => {
      state.hasViewedDappRequestBridgingBanner ??= {}
      state.hasViewedDappRequestBridgingBanner[action.payload.dappUrl] = action.payload.hasViewed
    },

    // Should only be used for testing
    resetWalletBehaviorHistory: (state, _action: PayloadAction) => {
      return {
        ...initialBehaviorHistoryState,

        // Shouldn't reset this one because it's based on account creation
        createdOnboardingRedesignAccount: state.createdOnboardingRedesignAccount,
      }
    },
  },
})

export const {
  setCreatedOnboardingRedesignAccount,
  setHasSkippedUnitagPrompt,
  setHasCompletedUnitagsIntroModal,
  setHasViewedWelcomeWalletCard,
  setHasUsedExplore,
  setBackupReminderLastSeenTs,
  setHasViewedOffRampTooltip,
  setHasViewedDappRequestBridgingBanner,
  resetWalletBehaviorHistory,
} = slice.actions

export const behaviorHistoryReducer = slice.reducer
