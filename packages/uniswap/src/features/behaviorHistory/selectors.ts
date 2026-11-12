import { AddressStringFormat, normalizeAddress } from '@universe/chains'
import {
  getNewUserOnboardingWalletKey,
  type NewUserOnboardingWalletHistory,
} from 'uniswap/src/features/behaviorHistory/newUserOnboarding'
import type { UniswapState } from 'uniswap/src/state/uniswapReducer'

export const selectHasViewedBridgingBanner = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.hasViewedBridgingBanner === true

export const selectHasDismissedBridgingWarning = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.hasDismissedBridgingWarning === true

export const selectHasDismissedLowNetworkTokenWarning = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.hasDismissedLowNetworkTokenWarning === true

export const selectHasViewedContractAddressExplainer = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.hasViewedContractAddressExplainer === true

export const selectHasShownMismatchToast = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.hasShownMismatchToast === true

/** Returns true if user has seen the modal globally (when disconnected) */
export const selectHasSeenToucanIntroModal = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.hasSeenToucanIntroModal === true

/** Returns true if user has seen the modal for a specific wallet */
export const selectHasSeenToucanIntroModalForWallet = (state: UniswapState, walletAddress: string): boolean =>
  state.uniswapBehaviorHistory.toucanIntroModalSeenByWallet?.[
    normalizeAddress(walletAddress, AddressStringFormat.Lowercase)
  ] === true

export const selectHasDismissedCrosschainSwapsPromoBanner = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.hasDismissedCrosschainSwapsPromoBanner === true

/** Tri-state: `undefined` = fresh state awaiting startup init, `false` = eligible, `true` = never show. */
export const selectPoolsBalanceCoachmarkDismissed = (state: UniswapState): boolean | undefined =>
  state.uniswapBehaviorHistory.hasDismissedPoolsBalanceCoachmark

export const selectHasDismissedExploreEarnCoachmark = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.hasDismissedExploreEarnCoachmark === true

export const selectHasDismissedPoolsOutageBanner = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.hasDismissedPoolsOutageBanner === true

export const selectHasAcknowledgedEarnHowItWorks = (state: UniswapState): boolean =>
  Object.keys(state.uniswapBehaviorHistory.earnHowItWorksAcknowledgedByVaultId ?? {}).length > 0

export const selectNewUserOnboardingWalletHistory = (
  state: UniswapState,
  address: string | undefined,
): NewUserOnboardingWalletHistory | undefined =>
  address ? state.uniswapBehaviorHistory.newUserOnboarding?.byWallet[getNewUserOnboardingWalletKey(address)] : undefined
