import type { SessionService, UniswapIdentifierService } from '@universe/sessions'
import { PlatformSplitStubError } from 'utilities/src/errors'
import type { Logger } from 'utilities/src/logger/logger'
import type { Interceptors } from './transport'

export function provideSessionService(_ctx: {
  getBaseUrl: () => string
  getIsSessionServiceEnabled?: () => boolean
  getLogger?: () => Logger
  /** Optional custom UniswapIdentifierService. If not provided, uses default localStorage-based service. */
  uniswapIdentifierService?: UniswapIdentifierService
  /** Optional ConnectRPC interceptors for the session transport */
  interceptors?: Interceptors
}): SessionService {
  throw new PlatformSplitStubError('provideSessionService')
}
