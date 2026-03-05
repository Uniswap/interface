import {
  type AppStateResetter,
  type AppStateResetterContext,
  createAppStateResetter,
} from 'uniswap/src/state/createAppStateResetter'
import { clearBatchedTransactions } from 'wallet/src/features/batchedTransactions/slice'
import { resetWalletBehaviorHistory } from 'wallet/src/features/behaviorHistory/slice'

/**
 * An extension of createAppStateResetter for wallet apps
 * In addition to the reset actions of createAppStateResetter,
 * this also triggers common wallet-specific reset actions.
 */
export function createWalletStateResetter({
  dispatch,
  onResetAccountHistory,
  onResetUserSettings,
  onResetQueryCaches,
}: AppStateResetterContext): AppStateResetter {
  return createAppStateResetter({
    dispatch,

    onResetAccountHistory: async () => {
      dispatch(clearBatchedTransactions())
      await onResetAccountHistory()
    },

    onResetUserSettings: async () => {
      dispatch(resetWalletBehaviorHistory())
      await onResetUserSettings()
    },

    onResetQueryCaches,
  })
}
