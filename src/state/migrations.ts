import { createMigrate, MigrationManifest, PersistedState, PersistMigrate } from 'redux-persist'
import { MigrationConfig } from 'redux-persist/es/createMigrate'

import { legacyListsMigrations, legacyTransactionMigrations, legacyUserMigrations } from './legacyMigrations'
import { initialState as initialListsState } from './lists/reducer'
import { initialState as initialTransactionsState } from './transactions/reducer'
import { initialState as initialUserState } from './user/reducer'

function tryParseOldState<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) : fallback
  } catch (e) {
    return fallback
  }
}

/**
 * These run once per state re-hydration when a version mismatch is detected.
 * Keep them as lightweight as possible.
 *
 * Migration functions should not assume that any value exists in localStorage previously,
 * because a user may be visiting the site for the first time or have cleared their localStorage.
 */

// The target version number is the key
export const migrations: MigrationManifest = {
  0: () => {
    const oldTransactions = localStorage.getItem('redux_localstorage_simple_transactions')
    const oldUser = localStorage.getItem('redux_localstorage_simple_user')
    const oldLists = localStorage.getItem('redux_localstorage_simple_lists')

    const newTransactions = tryParseOldState(oldTransactions, initialTransactionsState)
    const newUser = tryParseOldState(oldUser, initialUserState)
    const newLists = tryParseOldState(oldLists, initialListsState)

    const result = {
      user: legacyUserMigrations(newUser),
      transactions: legacyTransactionMigrations(newTransactions),
      lists: legacyListsMigrations(newLists),
      _persist: { version: 0, rehydrated: true },
    }

    localStorage.removeItem('redux_localstorage_simple_transactions')
    localStorage.removeItem('redux_localstorage_simple_user')
    localStorage.removeItem('redux_localstorage_simple_lists')
    return result
  },
}

// We use a custom migration function for the initial state, because redux-persist
// skips migration if there is no initial state in localStorage, but we want to migrate
// previous persisted state from redux-localstorage-simple.
export function customCreateMigrate(migrations: MigrationManifest, options: MigrationConfig): PersistMigrate {
  const defaultMigrate = createMigrate(migrations, options)

  return (state: PersistedState, currentVersion: number) => {
    if (state === undefined) {
      // If no state exists, run the migration for version 1
      return Promise.resolve(migrations[0](undefined))
    }

    // Otherwise, use the default migration process
    return defaultMigrate(state, currentVersion)
  }
}
