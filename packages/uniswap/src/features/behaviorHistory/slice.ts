import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AddressStringFormat, normalizeAddress } from '@universe/chains'
import {
  EARN_SWAP_UPSELL_MAX_DISPLAYS,
  getOrCreateEarnSwapUpsellTokenHistory,
  type EarnSwapUpsellHistory,
} from 'uniswap/src/features/behaviorHistory/earn/swapUpsell'
import {
  getOrCreateNewUserOnboardingWalletHistory,
  isNewUserOnboardingSwap,
  type NewUserOnboardingHistory,
  type NewUserOnboardingWalletHistory,
} from 'uniswap/src/features/behaviorHistory/newUserOnboarding'
import { finalizeTransaction } from 'uniswap/src/features/transactions/slice'

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
  hasShownSmartWalletNudge?: boolean
  /** Global flag for when user sees modal without wallet connected */
  hasSeenToucanIntroModal?: boolean
  /** Per-wallet tracking for Toucan intro modal */
  toucanIntroModalSeenByWallet?: {
    [walletAddress: string]: boolean
  }
  hasDismissedCrosschainSwapsPromoBanner?: boolean
  /**
   * Per-user tri-state for the pools-balance coachmark on the Portfolio Overview.
   * `false` = eligible (state existed before the pools-balances launch, not yet dismissed; set by a
   * migration); `true` = dismissed, or had no pools when first evaluated; `undefined` = state created
   * after launch. Only `false` shows the coachmark.
   */
  hasDismissedPoolsBalanceCoachmark?: boolean
  /** Per-user dismissal flag for the one-time Explore Earn deep-link coachmark. */
  hasDismissedExploreEarnCoachmark?: boolean
  hasDismissedPoolsOutageBanner?: boolean
  /** Vault acknowledgements; any entry suppresses the Earn deposit explainer globally. */
  earnHowItWorksAcknowledgedByVaultId?: Record<string, true>
  earnSwapUpsell?: EarnSwapUpsellHistory
  newUserOnboarding?: NewUserOnboardingHistory
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
  hasDismissedCrosschainSwapsPromoBanner: false,
  hasDismissedExploreEarnCoachmark: false,
  hasDismissedPoolsOutageBanner: false,
  earnHowItWorksAcknowledgedByVaultId: {},
  newUserOnboarding: { byWallet: {} },
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
    setHasShownSmartWalletNudge: (state, action: PayloadAction<boolean>) => {
      state.hasShownSmartWalletNudge = action.payload
    },
    setHasSeenToucanIntroModal: (state, action: PayloadAction<boolean>) => {
      state.hasSeenToucanIntroModal = action.payload
    },
    setToucanIntroModalSeenByWallet: (state, action: PayloadAction<{ walletAddress: string }>) => {
      state.toucanIntroModalSeenByWallet ??= {}
      state.toucanIntroModalSeenByWallet[
        normalizeAddress(action.payload.walletAddress, AddressStringFormat.Lowercase)
      ] = true
    },
    setHasDismissedBridgedAssetsBannerV2: (state, action: PayloadAction<boolean>) => {
      state.hasDismissedBridgedAssetsBannerV2 = action.payload
    },
    setHasDismissedCrosschainSwapsPromoBanner: (state, action: PayloadAction<boolean>) => {
      state.hasDismissedCrosschainSwapsPromoBanner = action.payload
    },
    // Payload defaults to `true` (dismiss). Pass `false` to re-show the coachmark, e.g. from a dev tool.
    setPoolsBalanceCoachmarkDismissed: (state, action: PayloadAction<boolean | undefined>) => {
      state.hasDismissedPoolsBalanceCoachmark = action.payload ?? true
    },
    // Payload defaults to `true` (dismiss). Pass `false` to re-show the coachmark from a dev tool.
    setExploreEarnCoachmarkDismissed: (state, action: PayloadAction<boolean | undefined>) => {
      state.hasDismissedExploreEarnCoachmark = action.payload ?? true
    },
    setHasDismissedPoolsOutageBanner: (state, action: PayloadAction<boolean>) => {
      state.hasDismissedPoolsOutageBanner = action.payload
    },
    setHasAcknowledgedEarnHowItWorks: (state, action: PayloadAction<{ vaultId: string }>) => {
      state.earnHowItWorksAcknowledgedByVaultId ??= {}
      state.earnHowItWorksAcknowledgedByVaultId[action.payload.vaultId] = true
    },
    recordEarnSwapUpsellQualifyingSwap: (
      state,
      action: PayloadAction<{ tokenCurrencyId: string; transactionId: string }>,
    ) => {
      const tokenHistory = getOrCreateEarnSwapUpsellTokenHistory(state, action.payload.tokenCurrencyId)

      tokenHistory.countedTransactionIds ??= {}
      if (tokenHistory.countedTransactionIds[action.payload.transactionId]) {
        return
      }

      tokenHistory.countedTransactionIds[action.payload.transactionId] = true
      tokenHistory.qualifyingSwapCount = (tokenHistory.qualifyingSwapCount ?? 0) + 1
    },
    recordEarnSwapUpsellInteraction: (
      state,
      action: PayloadAction<{ tokenCurrencyId: string; timestampMs: number }>,
    ) => {
      const tokenHistory = getOrCreateEarnSwapUpsellTokenHistory(state, action.payload.tokenCurrencyId)

      const interactionCount = (tokenHistory.interactionCount ?? 0) + 1
      tokenHistory.interactionCount = interactionCount
      tokenHistory.lastInteractionAtMs = action.payload.timestampMs
      tokenHistory.permanentlyDismissed =
        tokenHistory.permanentlyDismissed === true || interactionCount >= EARN_SWAP_UPSELL_MAX_DISPLAYS
    },
    permanentlyDismissEarnSwapUpsell: (state, action: PayloadAction<{ tokenCurrencyId: string }>) => {
      const tokenHistory = getOrCreateEarnSwapUpsellTokenHistory(state, action.payload.tokenCurrencyId)

      tokenHistory.permanentlyDismissed = true
    },
    setNewUserOnboardingWalletFlag: (
      state,
      action: PayloadAction<{ address: string; flag: keyof NewUserOnboardingWalletHistory }>,
    ) => {
      getOrCreateNewUserOnboardingWalletHistory(state, action.payload.address)[action.payload.flag] = true
    },
    setNewUserOnboardingChecklistExpanded: (state, action: PayloadAction<{ address: string; isExpanded: boolean }>) => {
      getOrCreateNewUserOnboardingWalletHistory(state, action.payload.address).checklistExpanded =
        action.payload.isExpanded
    },
  },
  extraReducers: (builder) => {
    // Every platform's finalize path (web updaters, wallet sagas) dispatches this action
    builder.addCase(finalizeTransaction, (state, { payload }) => {
      if (isNewUserOnboardingSwap(payload)) {
        getOrCreateNewUserOnboardingWalletHistory(state, payload.from).hasCompletedSwap = true
      }
    })
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
  setHasShownSmartWalletNudge,
  setHasSeenToucanIntroModal,
  setToucanIntroModalSeenByWallet,
  setHasDismissedBridgedAssetsBannerV2,
  setHasDismissedCrosschainSwapsPromoBanner,
  setPoolsBalanceCoachmarkDismissed,
  setExploreEarnCoachmarkDismissed,
  setHasDismissedPoolsOutageBanner,
  setHasAcknowledgedEarnHowItWorks,
  recordEarnSwapUpsellQualifyingSwap,
  recordEarnSwapUpsellInteraction,
  permanentlyDismissEarnSwapUpsell,
  setNewUserOnboardingWalletFlag,
  setNewUserOnboardingChecklistExpanded,
} = slice.actions

export const uniswapBehaviorHistoryReducer = slice.reducer
