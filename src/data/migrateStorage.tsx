// Copied from https://github.com/mrousavy/react-native-mmkv/blob/master/docs/MIGRATE_FROM_ASYNC_STORAGE.md

import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useState } from 'react'
import { InteractionManager } from 'react-native'
import { MMKV } from 'react-native-mmkv'
import { logger } from 'src/utils/logger'

const storage = new MMKV()

// TODO(MOB-2795): Remove `hasMigratedFromAsyncStorage` after a while (when everyone has migrated)
const hasMigratedFromAsyncStorage = storage.getBoolean('hasMigratedFromAsyncStorage')

// TODO(MOB-2795): Remove `hasMigratedFromAsyncStorage` after a while (when everyone has migrated)
async function migrateFromAsyncStorage(): Promise<void> {
  logger.info('migrateStorage', 'migrateFromAsyncStorage', 'Migrating from AsyncStorage -> MMKV...')
  const start = Date.now()

  const keys = await AsyncStorage.getAllKeys()
  logger.info('migrateStorage', 'migrateFromAsyncStorage', `Migrating ${keys.length} keys`)

  for (const key of keys) {
    try {
      const value = await AsyncStorage.getItem(key)

      if (value != null) {
        if (['true', 'false'].includes(value)) {
          storage.set(key, value === 'true')
        } else {
          storage.set(key, value)
        }

        AsyncStorage.removeItem(key)
      }
    } catch (error) {
      logger.error(
        'migrateStorage',
        'migrateFromAsyncStorage',
        `Failed to migrate key "${key}" from AsyncStorage to MMKV!`,
        error
      )
      throw error
    }
  }

  storage.set('hasMigratedFromAsyncStorage', true)

  const end = Date.now()
  logger.info(
    'migrateStorage',
    'migrateFromAsyncStorage',
    `Migrated from AsyncStorage -> MMKV in ${end - start}ms!`
  )
}

export function useStorageMigrator() {
  // TODO: Remove `hasMigratedFromAsyncStorage` after a while (when everyone has migrated)
  const [hasMigrated, setHasMigrated] = useState(hasMigratedFromAsyncStorage)

  useEffect(() => {
    if (!hasMigratedFromAsyncStorage) {
      InteractionManager.runAfterInteractions(async () => {
        try {
          await migrateFromAsyncStorage()
          setHasMigrated(true)
        } catch (e) {
          // TODO: fall back to AsyncStorage? Wipe storage clean and use MMKV? Crash app?
          logger.error('migrateStorage', 'useStorageMigrator', 'Failed ', e)
        }
      })
    }
  }, [])

  return hasMigrated
}
