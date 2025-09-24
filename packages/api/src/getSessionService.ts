import type { SessionService } from '@universe/sessions'
import { PlatformSplitStubError } from 'utilities/src/errors'

export function getSessionService(): SessionService {
  throw new PlatformSplitStubError('getSessionService')
}
