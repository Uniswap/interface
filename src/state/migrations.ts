import { MigrationManifest } from 'redux-persist'

/**
 * These run once per state re-hydration (i.e. once per page load).
 * Keep them as lightweight as possible.
 *
 * Migration functions should not assume that any value exists in localStorage previously,
 * because a user may be visiting the site for the first time or have cleared their localStorage.
 */

// The version number is the key
export const migrations: MigrationManifest = {
  0: (state) => {
    const oldTransactions = localStorage.getItem('redux_localstorage_simple_transactions')
    const oldUser = localStorage.getItem('redux_localstorage_simple_user')
    const oldLists = localStorage.getItem('redux_localstorage_simple_lists')

    const previousState = state as any
    try {
      const result = {
        user: JSON.parse(oldUser ?? '{}'),
        transactions: JSON.parse(oldTransactions ?? '{}'),
        lists: JSON.parse(oldLists ?? '{}'),
      }
      localStorage.removeItem('redux_localstorage_simple_transactions')
      localStorage.removeItem('redux_localstorage_simple_user')
      localStorage.removeItem('redux_localstorage_simple_lists')
      return result
    } catch (e) {
      // JSON parsing failed, use an empty state for the inital version.
      return previousState
    }
  },
}
