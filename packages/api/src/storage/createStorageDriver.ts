import { StorageDriver } from '@universe/api/src/storage/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export function createStorageDriver(): StorageDriver {
  throw new PlatformSplitStubError('createStorageDriver')
}

export type { StorageDriver } from '@universe/api/src/storage/types'
