import { PlatformSplitStubError } from 'utilities/src/errors'
import { StorageDriver } from './types'

export function getStorageDriver(): StorageDriver {
  throw new PlatformSplitStubError('getStorageDriver')
}

export type { StorageDriver } from './types'
