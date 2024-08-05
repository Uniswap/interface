/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import {
  activatePendingAccounts,
  addRoutingFieldToTransactions,
  deleteBetaOnboardingState,
  deleteExtensionOnboardingState,
  removeUniconV2BehaviorState,
  removeWalletIsUnlockedState,
} from 'wallet/src/state/sharedMigrations'

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
}

export const EXTENSION_STATE_VERSION = 6
