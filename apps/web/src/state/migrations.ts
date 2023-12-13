import { createMigrate, MigrationManifest, PersistedState, PersistMigrate } from 'redux-persist'
import { MigrationConfig } from 'redux-persist/es/createMigrate'

import { migration0 } from './migrations/0'
import { migration1 } from './migrations/1'
import { migration2 } from './migrations/2'
import { migration3 } from './migrations/3'
import { migration4 } from './migrations/4'
import { migration5 } from './migrations/5'
import { migration6 } from './migrations/6'
import { migration7 } from './migrations/7'
import { legacyLocalStorageMigration } from './migrations/legacy'

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
}

// We use a custom migration function for the initial state, because redux-persist
// skips migration if there is no initial state, but we want to migrate
// previous persisted state from redux-localstorage-simple.
export function customCreateMigrate(migrations: MigrationManifest, options: MigrationConfig): PersistMigrate {
  const defaultMigrate = createMigrate(migrations, options)

  return async (state: PersistedState, currentVersion: number) => {
    if (state === undefined) {
      // If no state exists, run the legacy migration to set initial state
      state = await legacyLocalStorageMigration()
    }

    // Otherwise, use the default migration process
    return defaultMigrate(state, currentVersion)
  }
}
