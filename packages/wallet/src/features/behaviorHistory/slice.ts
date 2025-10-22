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
  hasViewedBridgedAssetsCard?: boolean
  hasDismissedBridgingWarning?: boolean
  hasViewedDappRequestBridgingBanner?: {
    [dappUrl: string]: boolean
  }
  smartWalletNudge?: {
    [walletAddress: string]: {
      hasDismissedHomeScreenNudge?: boolean
      /**
       * Should show once per dapp per wallet.
       *
       * If not connected when `wallet_getCapabilities` is called, wait for connection then nudge
       */
      dappUrlToHasShownNudge?: Record<string, boolean>
      lastPostSwapNudge?: number
      numPostSwapNudges?: number
      isAllSmartWalletNudgesDisabled?: boolean
      lastHomeScreenNudgeShown?: number
    }
  }
  hasSeenSmartWalletCreatedWalletModal?: boolean
  /**
   * Whether the user has copied their private keys via the view private keys screen during
   * a restoration flow.
   */
  hasCopiedPrivateKeys?: boolean
  isAllSmartWalletNudgesDisabled?: boolean
}

export const initialBehaviorHistoryState: BehaviorHistoryState = {
  hasViewedConnectionMigration: false,
  hasSkippedUnitagPrompt: false,
  hasCompletedUnitagsIntroModal: false,
  hasViewedNotificationsCard: false,
  hasUsedExplore: false,
  backupReminderLastSeenTs: undefined,
  hasViewedBridgedAssetsCard: false,
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
    setHasViewedBridgedAssetsCard: (state, action: PayloadAction<boolean>) => {
      state.hasViewedBridgedAssetsCard = action.payload
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
      state.smartWalletNudge[action.payload.walletAddress] = {
        ...state.smartWalletNudge[action.payload.walletAddress],
        hasDismissedHomeScreenNudge: action.payload.hasDismissed,
      }
    },
    setHasShown5792Nudge: (
      state,
      action: PayloadAction<{
        walletAddress: string
        dappUrl: string
      }>,
    ) => {
      state.smartWalletNudge ??= {}
      state.smartWalletNudge[action.payload.walletAddress] = {
        ...state.smartWalletNudge[action.payload.walletAddress],
        dappUrlToHasShownNudge: {
          ...state.smartWalletNudge[action.payload.walletAddress]?.dappUrlToHasShownNudge,
          [action.payload.dappUrl]: true,
        },
      }
    },
    setIncrementNumPostSwapNudge: (
      state,
      action: PayloadAction<{
        walletAddress: string
      }>,
    ) => {
      state.smartWalletNudge ??= {}
      state.smartWalletNudge[action.payload.walletAddress] = {
        ...state.smartWalletNudge[action.payload.walletAddress],
        numPostSwapNudges: (state.smartWalletNudge[action.payload.walletAddress]?.numPostSwapNudges ?? 0) + 1,
        lastPostSwapNudge: Date.now(),
      }
    },
    setHasSeenSmartWalletCreatedWalletModal: (state) => {
      state.hasSeenSmartWalletCreatedWalletModal = true
    },
    setHasShownSmartWalletHomeScreenNudge: (state, action: PayloadAction<{ walletAddress: string }>) => {
      state.smartWalletNudge ??= {}
      state.smartWalletNudge[action.payload.walletAddress] = {
        ...state.smartWalletNudge[action.payload.walletAddress],
        lastHomeScreenNudgeShown: Date.now(),
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
    setIsAllSmartWalletNudgesDisabled: (
      state,
      action: PayloadAction<{ walletAddress: string; isDisabled: boolean }>,
    ) => {
      state.smartWalletNudge ??= {}
      state.smartWalletNudge[action.payload.walletAddress] = {
        ...state.smartWalletNudge[action.payload.walletAddress],
        isAllSmartWalletNudgesDisabled: action.payload.isDisabled,
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
  setHasViewedBridgedAssetsCard,
  setHasDismissedSmartWalletHomeScreenNudge,
  setHasCopiedPrivateKeys,
  setHasShown5792Nudge,
  setIncrementNumPostSwapNudge,
  setHasSeenSmartWalletCreatedWalletModal,
  setIsAllSmartWalletNudgesDisabled,
  setHasShownSmartWalletHomeScreenNudge,
} = slice.actions

export const behaviorHistoryReducer = slice.reducer
