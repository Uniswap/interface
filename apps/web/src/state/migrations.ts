import localForage from 'localforage'
import type { MigrationManifest, PersistedState, PersistMigrate } from 'redux-persist'
import { createMigrate } from 'redux-persist'
import type { MigrationConfig } from 'redux-persist/es/createMigrate'
import { migration0 } from 'state/migrations/0'
import { migration1 } from 'state/migrations/1'
import { migration2 } from 'state/migrations/2'
import { migration3 } from 'state/migrations/3'
import { migration4 } from 'state/migrations/4'
import { migration5 } from 'state/migrations/5'
import { migration6 } from 'state/migrations/6'
import { migration7 } from 'state/migrations/7'
import { migration8 } from 'state/migrations/8'
import { migration9 } from 'state/migrations/9'
import { migration10 } from 'state/migrations/10'
import { migration11 } from 'state/migrations/11'
import { migration12 } from 'state/migrations/12'
import { migration13 } from 'state/migrations/13'
import { migration14 } from 'state/migrations/14'
import { migration15 } from 'state/migrations/15'
import { migration16 } from 'state/migrations/16'
import { migration17 } from 'state/migrations/17'
import { migration18 } from 'state/migrations/18'
import { migration19 } from 'state/migrations/19'
import { migration20 } from 'state/migrations/20'
import { migration21 } from 'state/migrations/21'
import { migration22 } from 'state/migrations/22'
import { migration23 } from 'state/migrations/23'
import { migration24 } from 'state/migrations/24'
import { migration25 } from 'state/migrations/25'
import { migration49 } from 'state/migrations/49'
import { migration54 } from 'state/migrations/54'
import { migration55 } from 'state/migrations/55'
import { migration56 } from 'state/migrations/56'
import { migration57 } from 'state/migrations/57'
import { migration58 } from 'state/migrations/58'
import { migration59 } from 'state/migrations/59'
import { migration60 } from 'state/migrations/60'
import { createLocalTransactionAndSignatureClearingMigration } from 'state/migrations/clearLocalTransactionsAndSignatures'
import { createLocalTransactionClearingMigration } from 'state/migrations/createLocalTransactionClearingMigration'
import { legacyLocalStorageMigration } from 'state/migrations/legacy'
import { legacyCreateLocalTransactionClearingMigration } from 'state/migrations/legacyClearLocalTransactions'

/**
 * These run once per state re-hydration when a version mismatch is detected.
 * Keep them as lightweight as possible.
 *
 * Migration functions should not assume that any value exists in the persisted data previously,
 * because a user may be visiting the site for the first time or have cleared their data.
 */

// The target version number is the key
export const migrations: MigrationManifest = {
  0: migration0,
  1: migration1,
  2: migration2,
  3: migration3,
  4: migration4,
  5: migration5,
  6: migration6,
  7: migration7,
  8: migration8,
  9: migration9,
  10: migration10,
  11: migration11,
  12: migration12,
  13: migration13,
  14: migration14,
  15: migration15,
  16: migration16,
  17: migration17,
  18: migration18,
  19: migration19,
  20: migration20,
  21: migration21,
  22: migration22,
  23: migration23,
  24: migration24,
  25: migration25,
  26: legacyCreateLocalTransactionClearingMigration(26),
  27: legacyCreateLocalTransactionClearingMigration(27),
  28: legacyCreateLocalTransactionClearingMigration(28),
  29: legacyCreateLocalTransactionClearingMigration(29),
  30: createLocalTransactionAndSignatureClearingMigration(30),
  31: createLocalTransactionAndSignatureClearingMigration(31),
  32: legacyCreateLocalTransactionClearingMigration(32),
  33: legacyCreateLocalTransactionClearingMigration(33),
  34: legacyCreateLocalTransactionClearingMigration(34),
  35: legacyCreateLocalTransactionClearingMigration(35),
  36: legacyCreateLocalTransactionClearingMigration(36),
  37: legacyCreateLocalTransactionClearingMigration(37),
  38: legacyCreateLocalTransactionClearingMigration(38),
  39: legacyCreateLocalTransactionClearingMigration(39),
  40: legacyCreateLocalTransactionClearingMigration(40),
  41: legacyCreateLocalTransactionClearingMigration(41),
  42: legacyCreateLocalTransactionClearingMigration(42),
  43: legacyCreateLocalTransactionClearingMigration(43),
  44: legacyCreateLocalTransactionClearingMigration(44),
  45: legacyCreateLocalTransactionClearingMigration(45),
  46: legacyCreateLocalTransactionClearingMigration(46),
  47: legacyCreateLocalTransactionClearingMigration(47),
  48: legacyCreateLocalTransactionClearingMigration(48),
  49: migration49,
  50: createLocalTransactionClearingMigration(50),
  51: createLocalTransactionClearingMigration(51),
  52: createLocalTransactionClearingMigration(52),
  53: createLocalTransactionClearingMigration(53),
  54: migration54,
  55: migration55,
  56: migration56,
  57: migration57,
  58: migration58,
  59: migration59,
  60: migration60,
} as const

export const PERSIST_VERSION = 60

export const INDEXED_DB_REDUX_TABLE_NAME = 'redux'

const dbInstance = localForage.createInstance({
  name: INDEXED_DB_REDUX_TABLE_NAME,
})

// We use a custom migration function for the initial state, because redux-persist
// skips migration if there is no initial state, but we want to migrate
// previous persisted state from redux-localstorage-simple.
// This function also checks for the existence of the state in indexedDB so we can move
// it back to localStorage.
export function customCreateMigrate(migrations: MigrationManifest, options: MigrationConfig): PersistMigrate {
  const defaultMigrate = createMigrate(migrations, options)

  return async (state: PersistedState, currentVersion: number) => {
    if (state !== undefined) {
      // Use the default migration process if we have a state
      return defaultMigrate(state, currentVersion)
    }

    // If the user has visited the site before, they may have state in indexedDB
    // and need to migrate it back to localStorage
    const indexedDBState = await dbInstance.getItem('persist:interface')
    if (indexedDBState) {
      dbInstance.clear()
      return defaultMigrate(indexedDBState as PersistedState, currentVersion)
    }

    // If no state exists, run the legacy migration to set initial state
    state = await legacyLocalStorageMigration()
    return defaultMigrate(state, currentVersion)
  }
}
