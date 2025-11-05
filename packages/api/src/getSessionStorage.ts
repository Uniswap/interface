import { type SessionStorage } from '@universe/sessions'
import { PlatformSplitStubError } from 'utilities/src/errors'

function getSessionStorage(): SessionStorage {
  throw new PlatformSplitStubError('getSessionStorage')
}

export { getSessionStorage }
