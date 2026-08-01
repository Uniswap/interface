import type { Transport } from '@connectrpc/connect'
import type { DeviceIdService } from '@universe/sessions/src/device-id/types'
import type { SessionService } from '@universe/sessions/src/session-service/types'
import type { SessionStorage } from '@universe/sessions/src/session-storage/types'
import type { UniswapIdentifierService } from '@universe/sessions/src/uniswap-identifier/types'

export type TestSessionPlatform = 'web' | 'ios' | 'android' | 'extension'

export interface CreateTestSessionContextOptions {
  /** Which platform to simulate. Default: 'extension' */
  platform?: TestSessionPlatform
  /** Backend URL. Default: staging entry gateway */
  backendUrl?: string
  /** Whether to auto-upgrade (complete challenge flow). Default: true */
  autoUpgrade?: boolean
  /** Session ID persistence. Default: in-memory (inject e.g. a file store to persist across runs) */
  sessionStorage?: SessionStorage
  /** Device ID persistence. Default: in-memory */
  deviceIdService?: DeviceIdService
  /** Uniswap identifier persistence. Default: in-memory */
  uniswapIdentifierService?: UniswapIdentifierService
}

export interface TestSessionContext {
  /** Authenticated SessionService — same interface as production */
  sessionService: SessionService
  /** Session storage (in-memory unless injected), inspectable for assertions */
  sessionStorage: SessionStorage
  /** Device ID service (in-memory unless injected) */
  deviceIdService: DeviceIdService
  /** Uniswap identifier service (in-memory unless injected) */
  uniswapIdentifierService: UniswapIdentifierService
  /** The ConnectRPC transport used for session API calls */
  transport: Transport
  /** Resolves current session + device + request-source headers for raw HTTP use */
  getSessionHeaders: () => Promise<Record<string, string>>
  /** The backend URL this session was created against */
  backendUrl: string
  /** Platform this session was created for */
  platform: TestSessionPlatform
  /** Cookie jar (only populated for web platform) */
  cookieJar: Map<string, string> | null
  /** Tear down the session (removeSession + clear storage) */
  cleanup: () => Promise<void>
}
