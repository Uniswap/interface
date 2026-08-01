import { createChallengeSolverService } from '@universe/sessions/src/challenge-solvers/createChallengeSolverService'
import { createHashcashSolver } from '@universe/sessions/src/challenge-solvers/createHashcashSolver'
import { createNoneMockSolver } from '@universe/sessions/src/challenge-solvers/createNoneMockSolver'
// The `.web` core is imported explicitly (not via the platform-split `hashcash/core`
// specifier) so headless consumers work under plain Node loaders — Playwright's test
// runner, `bun` scripts — that don't resolve `.web.ts` extensions. The web implementation
// (`@noble/hashes` webcrypto) runs fine on Node ≥20 and edge runtimes.
import { findProof } from '@universe/sessions/src/challenge-solvers/hashcash/core.web'
import type { ChallengeSolver } from '@universe/sessions/src/challenge-solvers/types'
import type { DeviceIdService } from '@universe/sessions/src/device-id/types'
import { STAGING_ENTRY_GATEWAY_API_BASE_URL } from '@universe/sessions/src/entryGatewayUrls'
import type { FileSessionStore } from '@universe/sessions/src/headless/createFileSessionStore'
import { createFileSessionStore } from '@universe/sessions/src/headless/createFileSessionStore'
import type { PerformanceTracker } from '@universe/sessions/src/performance/types'
import { singleflight } from '@universe/sessions/src/session-gate/singleflight'
import { createSessionInitializationService } from '@universe/sessions/src/session-initialization/createSessionInitializationService'
import type { SessionServiceClient } from '@universe/sessions/src/session-repository/createSessionClient'
import { createSessionClient } from '@universe/sessions/src/session-repository/createSessionClient'
import { createSessionRepository } from '@universe/sessions/src/session-repository/createSessionRepository'
import { createSessionService } from '@universe/sessions/src/session-service/createSessionService'
import { ChallengeType } from '@universe/sessions/src/session-service/types'
import type { SessionStorage } from '@universe/sessions/src/session-storage/types'
import { createLocalHeaderTransport } from '@universe/sessions/src/test-utils/createLocalHeaderTransport'
import type { UniswapIdentifierService } from '@universe/sessions/src/uniswap-identifier/types'
import type { Logger } from 'utilities/src/logger/logger'

/** Default entry-gateway base URL for headless clients: staging. */
const DEFAULT_GATEWAY_BASE_URL = STAGING_ENTRY_GATEWAY_API_BASE_URL

/**
 * Request sources whose session flow is header-based (`X-Session-ID` / `X-Device-ID`).
 * `uniswap-web` is intentionally excluded: for web the backend keeps the session in a
 * cookie and omits `sessionId` from the InitSession body, so nothing could be persisted.
 */
type HeadlessRequestSource = 'uniswap-ios' | 'uniswap-android' | 'uniswap-extension'

/** Session auth headers for raw HTTP use (fetch/viem/anvil `--fork-header`). */
interface HeadlessSessionHeaders {
  'x-request-source': HeadlessRequestSource
  'X-Session-ID': string
  'X-Device-ID'?: string
}

/** Bootstrap completed but the backend issued no session ID — the session cannot be persisted or reused. */
class HeadlessSessionBootstrapError extends Error {
  constructor() {
    super('Session bootstrap completed without a session ID')
    this.name = 'HeadlessSessionBootstrapError'
  }
}

/**
 * A headless (Node/CLI) session client over the app session bootstrap.
 * See {@link createHeadlessSessionClient}.
 */
interface HeadlessSessionClient {
  /**
   * Resolves session auth headers, reusing the persisted session when one exists
   * (no network) and running the full bootstrap (initSession → challenge → verify,
   * then persist) when none does. Concurrent callers share a single bootstrap.
   *
   * Rejects with {@link HeadlessSessionBootstrapError} if the backend issues no
   * session ID, or with the underlying bootstrap error (e.g. `MaxChallengeRetriesError`).
   */
  getSessionHeaders(): Promise<HeadlessSessionHeaders>
  /**
   * Re-establishes the session reactively (call on 401). Single-flight: concurrent
   * calls share one recovery. The stored session ID is sent on the re-init so the
   * backend can revive it; a replacement session overwrites the persisted one.
   */
  recover(): Promise<void>
}

interface CreateHeadlessSessionClientContext {
  /** Entry-gateway base URL. Default: staging ({@link STAGING_ENTRY_GATEWAY_API_BASE_URL}). */
  gatewayBaseUrl?: string
  /** `x-request-source` for all session traffic. Default: `uniswap-extension`. */
  requestSource?: HeadlessRequestSource
  /**
   * Session ID persistence. Default: file-backed via {@link createFileSessionStore}
   * (`~/.uniswap/session.json`). Each persistence seam defaults independently — but the
   * file default requires Node (`node:fs`), so off-Node runtimes must inject BOTH
   * `sessionStorage` and `deviceIdService`.
   */
  sessionStorage?: SessionStorage
  /** Device ID persistence. Default: the same file-backed store (see {@link sessionStorage}). */
  deviceIdService?: DeviceIdService
  /** ConnectRPC SessionService client — the network seam. Default: a real client against `gatewayBaseUrl`. */
  sessionClient?: SessionServiceClient
  /** Clock for bootstrap timing. Default: `performance.now`. */
  performanceTracker?: PerformanceTracker
  getLogger?: () => Logger
}

function resolvePersistence(ctx?: CreateHeadlessSessionClientContext): {
  sessionStorage: SessionStorage
  deviceIdService: DeviceIdService
} {
  // Each seam defaults independently: an injected seam is always honored, and the
  // file store is only constructed when at least one seam is missing (both missing
  // seams share the same file). The file default requires Node — off-Node consumers
  // must inject both seams.
  let fileStore: FileSessionStore | undefined
  function defaultFileStore(): FileSessionStore {
    fileStore ??= createFileSessionStore()
    return fileStore
  }
  return {
    sessionStorage: ctx?.sessionStorage ?? defaultFileStore().sessionStorage,
    deviceIdService: ctx?.deviceIdService ?? defaultFileStore().deviceIdService,
  }
}

/**
 * Creates a headless session client for Node consumers (anvil fork bootstrap, CLI tooling,
 * integration tests): the apps' session bootstrap composed with pluggable persistence.
 *
 * Behavior:
 * - **Reuse-before-init**: a persisted session is returned without any network call, and
 *   the stored `X-Session-ID` rides on `initSession` whenever a bootstrap does run, so the
 *   backend can reuse the session instead of minting a new one.
 * - **Backend-issued identity**: session and device IDs come from the backend response and
 *   are persisted through the injected seams — never generated client-side.
 * - **Single-flight**: concurrent bootstraps and recoveries collapse into one attempt.
 * - Challenge flow matches the apps: hashcash solver, ≤3 retries, reactive-only recovery
 *   (no client-side TTL/refresh).
 *
 * With default (file) persistence this requires a Node runtime; inject in-memory seams for
 * other runtimes. The hashcash platform split is resolved explicitly to the web core, so
 * plain Node loaders (Playwright, `bun` scripts) need no `.web.ts` resolution config.
 */
function createHeadlessSessionClient(ctx?: CreateHeadlessSessionClientContext): HeadlessSessionClient {
  const gatewayBaseUrl = ctx?.gatewayBaseUrl ?? DEFAULT_GATEWAY_BASE_URL
  const requestSource = ctx?.requestSource ?? 'uniswap-extension'
  const performanceTracker = ctx?.performanceTracker ?? { now: (): number => performance.now() }

  const { sessionStorage, deviceIdService } = resolvePersistence(ctx)

  // The identifier is analytics-only for headless use — no reason to persist it.
  let uniswapIdentifier: string | null = null
  const uniswapIdentifierService: UniswapIdentifierService = {
    getUniswapIdentifier: async () => uniswapIdentifier,
    setUniswapIdentifier: async (identifier) => {
      uniswapIdentifier = identifier
    },
    removeUniswapIdentifier: async () => {
      uniswapIdentifier = null
    },
  }

  const sessionClient =
    ctx?.sessionClient ??
    createSessionClient({
      transport: createLocalHeaderTransport({
        baseUrl: gatewayBaseUrl,
        requestSource,
        getSessionId: async () => (await sessionStorage.get())?.sessionId ?? null,
        getDeviceId: async () => deviceIdService.getDeviceId(),
      }),
    })

  const sessionRepository = createSessionRepository({ client: sessionClient, getLogger: ctx?.getLogger })
  const sessionService = createSessionService({
    sessionStorage,
    deviceIdService,
    uniswapIdentifierService,
    sessionRepository,
  })

  const solvers = new Map<ChallengeType, ChallengeSolver>([
    [
      ChallengeType.HASHCASH,
      createHashcashSolver({ performanceTracker, findProofFn: findProof, getLogger: ctx?.getLogger }),
    ],
    [ChallengeType.UNSPECIFIED, createNoneMockSolver()],
  ])
  const sessionInitService = createSessionInitializationService({
    getSessionService: () => sessionService,
    challengeSolverService: createChallengeSolverService({ solvers }),
    performanceTracker,
    getIsSessionUpgradeAutoEnabled: () => true,
    getLogger: ctx?.getLogger,
  })

  // One shared slot: a bootstrap triggered by getSessionHeaders and a recover() join
  // the same in-flight establishment.
  const establish = singleflight(async (): Promise<void> => {
    await sessionInitService.initialize()
  })

  async function getSessionHeaders(): Promise<HeadlessSessionHeaders> {
    const stored = await sessionStorage.get()
    if (!stored?.sessionId) {
      await establish()
    }

    const sessionId = (await sessionStorage.get())?.sessionId
    if (!sessionId) {
      throw new HeadlessSessionBootstrapError()
    }

    const deviceId = await deviceIdService.getDeviceId()
    return {
      'x-request-source': requestSource,
      'X-Session-ID': sessionId,
      ...(deviceId ? { 'X-Device-ID': deviceId } : {}),
    }
  }

  return {
    getSessionHeaders,
    recover: establish,
  }
}

export { createHeadlessSessionClient, HeadlessSessionBootstrapError, DEFAULT_GATEWAY_BASE_URL }
export type { CreateHeadlessSessionClientContext, HeadlessRequestSource, HeadlessSessionClient, HeadlessSessionHeaders }
