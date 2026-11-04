import { isExtensionApp } from '@universe/environment'
import { createExtensionStorageDriver } from './createExtensionStorageDriver'
import { createWebStorageDriver } from './createWebStorageDriver'
import { type StorageDriver } from './types'

export function getStorageDriver(): StorageDriver {
  if (isExtensionApp) {
    return createExtensionStorageDriver()
  }
  return createWebStorageDriver()
}
