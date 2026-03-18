import { createNativeStorageDriver } from '@universe/api/src/storage/createNativeStorageDriver'
import { type StorageDriver } from '@universe/api/src/storage/types'

export function getStorageDriver(): StorageDriver {
  return createNativeStorageDriver()
}
