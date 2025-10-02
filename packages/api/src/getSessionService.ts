import type { SessionService } from '@universe/sessions'
import { PlatformSplitStubError } from 'utilities/src/errors'

export function getSessionService(_ctx: { getBaseUrl: () => string }): SessionService {
  throw new PlatformSplitStubError('getSessionService')
}
