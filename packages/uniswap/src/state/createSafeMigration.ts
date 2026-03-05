import { type PersistState } from 'redux-persist'
import { logger } from 'utilities/src/logger/logger'

interface SafeMigrationOptions<T> {
  /** Filename used for error logging */
  filename: string
  /** Function name used for error logging */
  name: string
  /** The migration function that transforms the state */
  migrate: (state: T) => T
  /** Error handler that returns fallback state */
  onError: (state: T) => T
}

type SafeMigrationOptionsWithoutFilename<T> = Omit<SafeMigrationOptions<T>, 'filename'>

/**
 * Wraps a Redux persist migration function with error handling and logging.
 * @note All new migrations should use this when possible
 *
 * @example
 * // Migration that preserves state on error
 * export const migration17 = createSafeMigration({
 *   filename: 'migrations',
 *   name: 'migration17',
 *   migrate: (state) => ({ ...state, newField: 'value' }),
 *   onError: (state) => state,
 * })
 *
 * @example
 * // Migration with custom error fallback
 * export const migrateSearchHistory = createSafeMigration({
 *   filename: 'uniswapMigrations',
 *   name: 'migrateSearchHistory',
 *   migrate: (state) => {
 *     const processed = processSearchHistory(state.searchHistory)
 *     return { ...state, searchHistory: processed }
 *   },
 *   onError: (state) => ({ ...state, searchHistory: { results: [] } }),
 * })
 */
export function createSafeMigration<T>({ filename, name, migrate, onError }: SafeMigrationOptions<T>): (state: T) => T {
  return (state: T): T => {
    try {
      return migrate(state)
    } catch (error) {
      logger.error(new Error(`Migration failed: ${name}`, { cause: error }), {
        tags: { file: filename, function: name },
      })
      return onError(state)
    }
  }
}

/**
 * Returns a createSafeMigration function with a pre-set filename.
 *
 * @example
 * // Create a factory for a specific file
 * const createMigration = createSafeMigrationFactory('uniswapMigrations')
 *
 * export const migrateSearchHistory = createMigration({
 *   name: 'migrateSearchHistory',
 *   migrate: (state) => ({ ...state, searchHistory: processed }),
 *   onError: (state) => ({ ...state, searchHistory: { results: [] } }),
 * })
 */
export function createSafeMigrationFactory(
  filename: string,
): <T>(options: SafeMigrationOptionsWithoutFilename<T>) => (state: T) => T {
  return <T>(options: SafeMigrationOptionsWithoutFilename<T>) => createSafeMigration({ filename, ...options })
}

/**
 * Creates a PersistState object from the migration state, ensuring required fields.
 * Useful in migration `onError` handlers where optional chaining can make `rehydrated` undefined.
 */
export function createPersistState(state: { _persist?: PersistState } | undefined, version: number): PersistState {
  return {
    ...state?._persist,
    version,
    rehydrated: state?._persist?.rehydrated ?? false,
  }
}
