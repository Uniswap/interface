import { createNativeStorageDriver } from './createNativeStorageDriver'
import { type StorageDriver } from './types'

export function getStorageDriver(): StorageDriver {
  return createNativeStorageDriver()
}
