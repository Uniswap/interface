import { createSlice, PayloadAction } from '@reduxjs/toolkit'

/**
 * Used to store persisted info about a users interactions with UI.
 * We use this to show conditional UI, usually only for the first time a user views a new feature.
 */
export interface NexTradeBehaviorHistoryState {
  hasViewedBridgingBanner?: boolean
  hasDismissedBridgingWarning?: boolean
  hasDismissedLowNetworkTokenWarning?: boolean
  hasViewedContractAddressExplainer?: boolean
  unichainPromotion?: {
    coldBannerDismissed?: boolean
    warmBannerDismissed?: boolean
    networkSelectorAnimationSeen?: boolean
    networkSelectorTooltipSeen?: boolean
    bridgingTooltipSeen?: boolean
    bridgingAnimationSeen?: boolean
    isFirstUnichainBridgeSelection?: boolean
  }
  // whether we have shown the mismatch toast (related to wallet capabilities & wallet bytecode)
  hasShownMismatchToast?: boolean
  /** Wallet addresses with timestamps that have dismissed the graduate wallet card for 30 days. The same property in the application reducer is a list of wallet addresses that have dismissed the graduated wallet card for this session. */
  embeddedWalletGraduateCardDismissed?: {
    [walletAddress: string]: number
  }
  hasShownSmartWalletNudge?: boolean
}

export const initialNexTradeBehaviorHistoryState: NexTradeBehaviorHistoryState = {
  hasViewedBridgingBanner: false,
  hasDismissedBridgingWarning: false,
  hasDismissedLowNetworkTokenWarning: false,
  hasViewedContractAddressExplainer: false,
  unichainPromotion: {
    coldBannerDismissed: false,
    warmBannerDismissed: false,
    networkSelectorAnimationSeen: false,
    networkSelectorTooltipSeen: false,
    bridgingTooltipSeen: false,
    bridgingAnimationSeen: false,
    isFirstUnichainBridgeSelection: true,
  },
  hasShownMismatchToast: false,
  hasShownSmartWalletNudge: false,
}

const slice = createSlice({
  name: 'nextradeBehaviorHistory',
  initialState: initialNexTradeBehaviorHistoryState,
  reducers: {
    setHasViewedBridgingBanner: (state, action: PayloadAction<boolean>) => {
      state.hasViewedBridgingBanner = action.payload
    },
    setHasDismissedBridgingWarning: (state, action: PayloadAction<boolean>) => {
      state.hasDismissedBridgingWarning = action.payload
    },
    setHasDismissedLowNetworkTokenWarning: (state, action: PayloadAction<boolean>) => {
      state.hasDismissedLowNetworkTokenWarning = action.payload
    },
    setHasViewedContractAddressExplainer: (state, action: PayloadAction<boolean>) => {
      state.hasViewedContractAddressExplainer = action.payload
    },
    setHasDismissedUnichainColdBanner: (state, action: PayloadAction<boolean>) => {
      state.unichainPromotion ??= {}
      state.unichainPromotion.coldBannerDismissed = action.payload
    },
    setHasDismissedUnichainWarmBanner: (state, action: PayloadAction<boolean>) => {
      state.unichainPromotion ??= {}
      state.unichainPromotion.warmBannerDismissed = action.payload
    },
    setHasSeenNetworkSelectorAnimation: (state, action: PayloadAction<boolean>) => {
      state.unichainPromotion ??= {}
      state.unichainPromotion.networkSelectorAnimationSeen = action.payload
    },
    setHasSeenNetworkSelectorTooltip: (state, action: PayloadAction<boolean>) => {
      state.unichainPromotion ??= {}
      state.unichainPromotion.networkSelectorTooltipSeen = action.payload
    },
    setHasSeenBridgingTooltip: (state, action: PayloadAction<boolean>) => {
      state.unichainPromotion ??= {}
      state.unichainPromotion.bridgingTooltipSeen = action.payload
    },
    setIsFirstUnichainBridgeSelection: (state, action: PayloadAction<boolean>) => {
      state.unichainPromotion ??= {}
      state.unichainPromotion.isFirstUnichainBridgeSelection = action.payload
    },
    setHasSeenBridgingAnimation: (state, action: PayloadAction<boolean>) => {
      state.unichainPromotion ??= {}
      state.unichainPromotion.bridgingAnimationSeen = action.payload
    },
    // Should only be used for testing
    resetNexTradeBehaviorHistory: (_state, _action: PayloadAction) => {
      return initialNexTradeBehaviorHistoryState
    },
    setHasShownMismatchToast: (state, action: PayloadAction<boolean>) => {
      state.hasShownMismatchToast = action.payload
    },
    setEmbeddedWalletGraduateCardDismissed: (state, action: PayloadAction<{ walletAddress: string }>) => {
      state.embeddedWalletGraduateCardDismissed ??= {}
      state.embeddedWalletGraduateCardDismissed[action.payload.walletAddress] = new Date().getTime()
    },
    setHasShownSmartWalletNudge: (state, action: PayloadAction<boolean>) => {
      state.hasShownSmartWalletNudge = action.payload
    },
  },
})

export const {
  setHasViewedBridgingBanner,
  setHasDismissedBridgingWarning,
  setHasDismissedLowNetworkTokenWarning,
  setHasDismissedUnichainColdBanner,
  setHasDismissedUnichainWarmBanner,
  setHasSeenNetworkSelectorAnimation,
  setHasSeenNetworkSelectorTooltip,
  setHasSeenBridgingTooltip,
  setIsFirstUnichainBridgeSelection,
  setHasSeenBridgingAnimation,
  resetNexTradeBehaviorHistory,
  setHasViewedContractAddressExplainer,
  setHasShownMismatchToast,
  setEmbeddedWalletGraduateCardDismissed,
  setHasShownSmartWalletNudge,
} = slice.actions

export const nextradeBehaviorHistoryReducer = slice.reducer
