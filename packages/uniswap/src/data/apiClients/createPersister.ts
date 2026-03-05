import { type Persister } from '@tanstack/react-query-persist-client'
import { PlatformSplitStubError } from 'utilities/src/errors'

export function createPersister(_key?: string): Persister {
  throw new PlatformSplitStubError('createPersister')
}
