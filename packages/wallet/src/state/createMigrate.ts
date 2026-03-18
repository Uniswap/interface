// Adapted from https://github.com/rt2zz/redux-persist/blob/master/src/createMigrate.ts to add more logging
import type { MigrationManifest, PersistedState } from 'redux-persist'
import { DEFAULT_VERSION } from 'redux-persist/es/constants'
import { logger } from 'utilities/src/logger/logger'

export function createMigrate(
  migrations: MigrationManifest,
): (state: PersistedState, currentVersion: number) => Promise<PersistedState> {
  return function (state: PersistedState, currentVersion: number): Promise<PersistedState> {
    try {
      if (!state) {
        logger.debug('redux-persist', 'createMigrate', 'no inbound state, skipping migration')
        return Promise.resolve(undefined)
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const inboundVersion: number = state._persist.version ?? DEFAULT_VERSION

      if (inboundVersion === currentVersion) {
        logger.debug('redux-persist', 'createMigrate', `versions match (${currentVersion}), noop migration`)
        return Promise.resolve(state)
      }

      if (inboundVersion > currentVersion) {
        logger.debug('redux-persist', 'createMigrate', 'downgrading version is not supported')
        return Promise.resolve(state)
      }

      const migrationKeys = Object.keys(migrations)
        .map((ver) => parseInt(ver, 10))
        .filter((key) => currentVersion >= key && key > inboundVersion)
        .sort((a, b) => a - b)

      logger.debug('redux-persist', 'createMigrate', `migrationKeys: ${migrationKeys}`)

      const migratedState: PersistedState = migrationKeys.reduce((versionState: PersistedState, versionKey) => {
        logger.debug('redux-persist', 'createMigrate', `running migration for versionKey: ${versionKey}`)
        // Safe non-null assertion because `versionKey` comes from `Object.keys(migrations)`
        // biome-ignore lint/style/noNonNullAssertion: Safe assertion in test or migration context
        return migrations[versionKey]!(versionState)
      }, state)

      return Promise.resolve(migratedState)
    } catch (error) {
      logger.error(error, { tags: { file: 'redux-persist', function: 'createMigrate' } })
      return Promise.reject(error)
    }
  }
}
