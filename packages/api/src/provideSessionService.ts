import type { SessionService, UniswapIdentifierService } from '@universe/sessions'
import { PlatformSplitStubError } from 'utilities/src/errors'
import type { Logger } from 'utilities/src/logger/logger'

export function provideSessionService(_ctx: {
  getBaseUrl: () => string
  getIsSessionServiceEnabled: () => boolean
  getLogger?: () => Logger
  /** Optional custom UniswapIdentifierService. If not provided, uses default localStorage-based service. */
  uniswapIdentifierService?: UniswapIdentifierService
}): SessionService {
  throw new PlatformSplitStubError('provideSessionService')
}
