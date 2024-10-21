/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import {
  activatePendingAccounts,
  addCreatedOnboardingRedesignAccountBehaviorHistory,
  addExploreAndWelcomeBehaviorHistory,
  addHapticSetting,
  addRoutingFieldToTransactions,
  deleteBetaOnboardingState,
  deleteDefaultFavoritesFromFavoritesState,
  deleteExtensionOnboardingState,
  deleteHoldToSwapBehaviorHistory,
  moveCurrencySetting,
  moveDismissedTokenWarnings,
  moveLanguageSetting,
  moveUserSettings,
  removeUniconV2BehaviorState,
  removeWalletIsUnlockedState,
} from 'wallet/src/state/walletMigrations'

export const migrations = {
  0: removeWalletIsUnlockedState,
  1: removeUniconV2BehaviorState,
  2: addRoutingFieldToTransactions,
  3: activatePendingAccounts,
  4: function removeDappInfoToChromeLocalStorage({ dapp: _dapp, ...state }: any) {
    return state
  },
  5: deleteBetaOnboardingState,
  6: deleteExtensionOnboardingState,
  7: deleteDefaultFavoritesFromFavoritesState,
  8: addHapticSetting,
  9: addExploreAndWelcomeBehaviorHistory,
  10: moveUserSettings,
  11: deleteHoldToSwapBehaviorHistory,
  12: addCreatedOnboardingRedesignAccountBehaviorHistory,
  13: moveDismissedTokenWarnings,
  14: moveLanguageSetting,
  15: moveCurrencySetting,
}

export const EXTENSION_STATE_VERSION = 15
