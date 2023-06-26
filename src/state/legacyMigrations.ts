import { ConnectionType } from 'connection/types'
import { DEFAULT_LIST_OF_LISTS } from 'constants/lists'
import { DEFAULT_DEADLINE_FROM_NOW } from 'constants/misc'

import { ListsState, NEW_LIST_STATE } from './lists/reducer'
import { RouterPreference } from './routing/slice'
import { TransactionState } from './transactions/reducer'
import { UserState } from './user/reducer'
import { SlippageTolerance } from './user/types'

const currentTimestamp = () => new Date().getTime()

/**
 * These functions handle all migrations that existed before we started tracking version numbers.
 */

export function legacyTransactionMigrations(state: any): TransactionState {
  // Make a copy of the object so we can mutate it.
  const result = JSON.parse(JSON.stringify(state))
  // in case there are any transactions in the store with the old format, remove them
  Object.keys(result).forEach((chainId) => {
    const chainTransactions = result[chainId as unknown as number]
    Object.keys(chainTransactions).forEach((hash) => {
      if (!('info' in chainTransactions[hash])) {
        // clear old transactions that don't have the right format
        delete chainTransactions[hash]
      }
    })
  })
  return result
}

export function legacyListsMigrations(state: any): ListsState {
  // Make a copy of the object so we can mutate it.
  const result = JSON.parse(JSON.stringify(state))

  if (!result.lastInitializedDefaultListOfLists) {
    return result
  } else if (result.lastInitializedDefaultListOfLists) {
    // lastInitializedDefaultListOfLists is expected to be string[]
    const lastInitializedSet = result.lastInitializedDefaultListOfLists.reduce(
      (s: Set<string>, l: string) => s.add(l),
      new Set()
    )
    const newListOfListsSet = DEFAULT_LIST_OF_LISTS.reduce<Set<string>>((s, l) => s.add(l), new Set())

    DEFAULT_LIST_OF_LISTS.forEach((listUrl) => {
      if (!lastInitializedSet.has(listUrl)) {
        result.byUrl[listUrl] = NEW_LIST_STATE
      }
    })

    result.lastInitializedDefaultListOfLists.forEach((listUrl: string) => {
      if (!newListOfListsSet.has(listUrl)) {
        delete result.byUrl[listUrl]
      }
    })
  }

  result.lastInitializedDefaultListOfLists = DEFAULT_LIST_OF_LISTS

  return result
}

export function legacyUserMigrations(state: any): UserState {
  // Make a copy of the object so we can mutate it.
  const result = JSON.parse(JSON.stringify(state))
  // If `selectedWallet` is ConnectionType.UNI_WALLET (deprecated) switch it to ConnectionType.UNISWAP_WALLET
  if (result.selectedWallet === 'UNIWALLET') {
    result.selectedWallet = ConnectionType.UNISWAP_WALLET
  }

  // If `userSlippageTolerance` is not present or its value is invalid, reset to default
  if (
    typeof result.userSlippageTolerance !== 'number' ||
    !Number.isInteger(result.userSlippageTolerance) ||
    result.userSlippageTolerance < 0 ||
    result.userSlippageTolerance > 5000
  ) {
    result.userSlippageTolerance = SlippageTolerance.Auto
  } else {
    if (
      !result.userSlippageToleranceHasBeenMigratedToAuto &&
      [10, 50, 100].indexOf(result.userSlippageTolerance) !== -1
    ) {
      result.userSlippageTolerance = SlippageTolerance.Auto
      result.userSlippageToleranceHasBeenMigratedToAuto = true
    }
  }

  // If `userDeadline` is not present or its value is invalid, reset to default
  if (
    typeof result.userDeadline !== 'number' ||
    !Number.isInteger(result.userDeadline) ||
    result.userDeadline < 60 ||
    result.userDeadline > 180 * 60
  ) {
    result.userDeadline = DEFAULT_DEADLINE_FROM_NOW
  }

  // If `userRouterPreference` is not present, reset to default
  if (typeof result.userRouterPreference !== 'string') {
    result.userRouterPreference = RouterPreference.AUTO
  }

  result.lastUpdateVersionTimestamp = currentTimestamp()
  return result
}
