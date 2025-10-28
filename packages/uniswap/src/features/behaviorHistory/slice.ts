import { createSlice, PayloadAction } from '@reduxjs/toolkit'

/**
 * Used to store persisted info about a users interactions with UI.
 * We use this to show conditional UI, usually only for the first time a user views a new feature.
 */
export interface UniswapBehaviorHistoryState {
  hasViewedBridgingBanner?: boolean
  hasDismissedBridgingWarning?: boolean
  hasDismissedLowNetworkTokenWarning?: boolean
  hasViewedContractAddressExplainer?: boolean
  hasDismissedBridgedAssetsBannerV2?: boolean
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
  hasSeenToucanIntroModal?: boolean
}

export const initialUniswapBehaviorHistoryState: UniswapBehaviorHistoryState = {
  hasViewedBridgingBanner: false,
  hasDismissedBridgingWarning: false,
  hasDismissedLowNetworkTokenWarning: false,
  hasViewedContractAddressExplainer: false,
  hasDismissedBridgedAssetsBannerV2: false,
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
  hasSeenToucanIntroModal: false,
}

const slice = createSlice({
  name: 'uniswapBehaviorHistory',
  initialState: initialUniswapBehaviorHistoryState,
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
    resetUniswapBehaviorHistory: (_state, _action: PayloadAction) => {
      return initialUniswapBehaviorHistoryState
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
    setHasSeenToucanIntroModal: (state, action: PayloadAction<boolean>) => {
      state.hasSeenToucanIntroModal = action.payload
    },
    setHasDismissedBridgedAssetsBannerV2: (state, action: PayloadAction<boolean>) => {
      state.hasDismissedBridgedAssetsBannerV2 = action.payload
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
  resetUniswapBehaviorHistory,
  setHasViewedContractAddressExplainer,
  setHasShownMismatchToast,
  setEmbeddedWalletGraduateCardDismissed,
  setHasShownSmartWalletNudge,
  setHasSeenToucanIntroModal,
  setHasDismissedBridgedAssetsBannerV2,
} = slice.actions

export const uniswapBehaviorHistoryReducer = slice.reducer
