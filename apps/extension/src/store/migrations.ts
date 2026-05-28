/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import {
  migratePendingDappRequestsToRecord,
  migrateUnknownBackupAccountsToMaybeManualBackup,
  removeDappInfoToChromeLocalStorage,
} from 'src/store/extensionMigrations'
import { unchecksumDismissedTokenWarningKeys } from 'uniswap/src/state/uniswapMigrations'
import {
  activatePendingAccounts,
  addBatchedTransactions,
  addCreatedOnboardingRedesignAccountBehaviorHistory,
  addExploreAndWelcomeBehaviorHistory,
  addHapticSetting,
  addRoutingFieldToTransactions,
  deleteBetaOnboardingState,
  deleteDefaultFavoritesFromFavoritesState,
  deleteExtensionOnboardingState,
  deleteHoldToSwapBehaviorHistory,
  deleteWelcomeWalletCardBehaviorHistory,
  moveCurrencySetting,
  moveDismissedTokenWarnings,
  moveLanguageSetting,
  moveTokenAndNFTVisibility,
  moveUserSettings,
  removeCreatedOnboardingRedesignAccountBehaviorHistory,
  removeUniconV2BehaviorState,
  removeWalletIsUnlockedState,
  updateExploreOrderByType,
} from 'wallet/src/state/walletMigrations'

export const migrations = {
  0: removeWalletIsUnlockedState,
  1: removeUniconV2BehaviorState,
  2: addRoutingFieldToTransactions,
  3: activatePendingAccounts,
  4: removeDappInfoToChromeLocalStorage,
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
  16: updateExploreOrderByType,
  17: removeCreatedOnboardingRedesignAccountBehaviorHistory,
  18: unchecksumDismissedTokenWarningKeys,
  19: deleteWelcomeWalletCardBehaviorHistory,
  20: moveTokenAndNFTVisibility,
  21: migratePendingDappRequestsToRecord,
  22: addBatchedTransactions,
  23: migrateUnknownBackupAccountsToMaybeManualBackup,
}

export const EXTENSION_STATE_VERSION = 23
