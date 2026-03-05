import { type Dispatch } from '@reduxjs/toolkit'
import { resetAppearanceSettings } from 'uniswap/src/features/appearance/slice'
import { resetUniswapBehaviorHistory } from 'uniswap/src/features/behaviorHistory/slice'
import { resetFavorites } from 'uniswap/src/features/favorites/slice'
import { clearNotificationQueue, resetNotifications } from 'uniswap/src/features/notifications/slice/slice'
import { resetPortfolio } from 'uniswap/src/features/portfolio/slice/slice'
import { clearSearchHistory } from 'uniswap/src/features/search/searchHistorySlice'
import { resetUserSettings as resetUniswapUserSettings } from 'uniswap/src/features/settings/slice'
import { resetDelegation } from 'uniswap/src/features/smartWallet/delegation/slice'
import { resetTiming } from 'uniswap/src/features/timing/slice'
import { resetTokens } from 'uniswap/src/features/tokens/warnings/slice/slice'
import { resetTransactions } from 'uniswap/src/features/transactions/slice'
import { resetSwapSettings } from 'uniswap/src/features/transactions/swap/state/slice'
import { resetVisibility } from 'uniswap/src/features/visibility/slice'
import { createLogger } from 'utilities/src/logger/logger'

export interface AppStateResetter {
  resetAccountHistory(): Promise<void>
  resetUserSettings(): Promise<void>
  resetQueryCaches(): Promise<void>
  resetAll(): Promise<void>
}

export interface AppStateResetterContext {
  dispatch: Dispatch
  onResetAccountHistory: () => void | Promise<void>
  onResetUserSettings: () => void | Promise<void>
  onResetQueryCaches: () => void | Promise<void>
}

/**
 * AppStateResetter is used to clear non-essential app data.
 * This is intended to partially reset an app to a clean state,
 * e.g. to help debug an issue without requiring a full reinstall.
 *
 * It should never be used to delete keys.
 *
 * The resetter will clear data from redux slices shared by all apps.
 * Apps must trigger resets of any app-specific data via the callback parameters.
 */
export function createAppStateResetter({
  dispatch,
  onResetAccountHistory,
  onResetUserSettings,
  onResetQueryCaches,
}: AppStateResetterContext): AppStateResetter {
  const logger = createLogger('createAppStateResetter.ts', 'createAppStateResetter')

  const resetAccountHistory = async (): Promise<void> => {
    logger.info('Resetting app data: account history')

    dispatch(clearNotificationQueue())
    dispatch(resetPortfolio())
    dispatch(clearSearchHistory())
    dispatch(resetTiming())
    dispatch(resetTransactions())
    dispatch(resetDelegation())

    await onResetAccountHistory()
  }

  const resetUserSettings = async (): Promise<void> => {
    logger.info('Resetting app data: user settings')

    dispatch(resetAppearanceSettings())
    dispatch(resetSwapSettings())
    dispatch(resetFavorites())
    dispatch(resetNotifications())
    dispatch(resetTokens())
    dispatch(resetUniswapBehaviorHistory())
    dispatch(resetUniswapUserSettings())
    dispatch(resetVisibility())

    await onResetUserSettings()
  }

  const resetQueryCaches = async (): Promise<void> => {
    logger.info('Resetting app data: query caches')

    await onResetQueryCaches()
  }

  const resetAll = async (): Promise<void> => {
    await resetAccountHistory()
    await resetUserSettings()
    await resetQueryCaches()
  }

  return {
    resetAccountHistory,
    resetUserSettings,
    resetQueryCaches,
    resetAll,
  }
}
