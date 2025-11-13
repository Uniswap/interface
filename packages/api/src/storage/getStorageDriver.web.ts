import { createExtensionStorageDriver } from '@universe/api/src/storage/createExtensionStorageDriver'
import { createWebStorageDriver } from '@universe/api/src/storage/createWebStorageDriver'
import { type StorageDriver } from '@universe/api/src/storage/types'
import { isExtensionApp } from 'utilities/src/platform'

export function getStorageDriver(): StorageDriver {
  if (isExtensionApp) {
    return createExtensionStorageDriver()
  }
  return createWebStorageDriver()
}
