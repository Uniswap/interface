import type { Transport } from '@connectrpc/connect'
import type { SessionService } from '@universe/sessions/src/session-service/types'
import type {
  InMemoryDeviceIdService,
  InMemorySessionStorage,
  InMemoryUniswapIdentifierService,
} from '@universe/sessions/src/test-utils'

export type TestSessionPlatform = 'web' | 'ios' | 'android' | 'extension'

export interface CreateTestSessionContextOptions {
  /** Which platform to simulate. Default: 'extension' */
  platform?: TestSessionPlatform
  /** Backend URL. Default: staging entry gateway */
  backendUrl?: string
  /** Whether to auto-upgrade (complete challenge flow). Default: true */
  autoUpgrade?: boolean
}

export interface TestSessionContext {
  /** Authenticated SessionService — same interface as production */
  sessionService: SessionService
  /** In-memory session storage, inspectable for assertions */
  sessionStorage: InMemorySessionStorage
  /** In-memory device ID service */
  deviceIdService: InMemoryDeviceIdService
  /** In-memory Uniswap identifier service */
  uniswapIdentifierService: InMemoryUniswapIdentifierService
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
