import type { SessionService } from '@universe/sessions'
import { PlatformSplitStubError } from 'utilities/src/errors'
import type { Logger } from 'utilities/src/logger/logger'

export function provideSessionService(_ctx: {
  getBaseUrl: () => string
  getIsSessionServiceEnabled: () => boolean
  getLogger?: () => Logger
}): SessionService {
  throw new PlatformSplitStubError('provideSessionService')
}
