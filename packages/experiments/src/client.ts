import { logger } from 'utilities/src/logger/logger'
import { EXPERIMENTS_HEADER_NAME, parseExperimentsHeader, serializeExperimentsHeader } from './codec'
import { createExperimentsStore } from './store'
import type { ExperimentCollision, ExperimentCollisionReporter, ExperimentOverride, ExperimentsMap } from './types'

/**
 * The experiments client: the active-experiments store plus the two transport ends —
 * `toHeaders` (write, FE→BE) and `absorb` (read, BE→FE). Everything above this in the
 * stack (React hooks, the gating bridge) and everything below it (the fetch client)
 * talks to a client; nobody touches the header or the JSON directly.
 */
export interface ExperimentsClient {
  /** The current active experiments. */
  snapshot: () => ExperimentsMap
  get: (name: string) => ExperimentOverride | undefined
  /**
   * Contribute an experiment to the active set so it rides along on future requests (FE→BE).
   * Idempotent; a conflicting value is reported via `onCollision`, not overwritten.
   */
  set: (name: string, override: ExperimentOverride) => void
  /**
   * Serialize the active set into request headers. Returns `{}` (no header) when empty,
   * so a request without experiments carries nothing. Synchronous — safe as a `getHeaders` thunk.
   */
  toHeaders: () => Record<string, string>
  /**
   * Merge experiments the backend echoed or originated, read off a response (BE→FE).
   * Tolerant of a malformed/empty response that omits `headers` — absorbs nothing rather than throwing.
   */
  absorb: (response: Partial<Pick<Response, 'headers'>>) => void
  /** Reset the active set — e.g. on logout, when the user (and their buckets) change. */
  clear: () => void
  /** Subscribe to changes. Backs the React `useSyncExternalStore` bindings. */
  subscribe: (listener: () => void) => () => void
  /** Stable snapshot getter for `useSyncExternalStore`. Identity changes only on real change. */
  getSnapshot: () => ExperimentsMap
}

export interface ExperimentsClientConfig {
  /**
   * Fired when a write conflicts with a differing existing value (the PRD "alarm").
   * Injected at the boundary so the package never imports analytics. Defaults to a
   * logged warning when omitted.
   */
  onCollision?: ExperimentCollisionReporter
}

function defaultCollisionReporter(collision: ExperimentCollision): void {
  logger.warn(
    'experiments/client.ts',
    'onCollision',
    `Conflicting write for experiment "${collision.name}" via ${collision.source}; keeping the existing value`,
    collision,
  )
}

/**
 * Create an isolated experiments client. Prefer the shared `getExperimentsClient()` for
 * app wiring (so the fetch client and the React hooks share one set); use this factory for
 * tests and any context that needs its own isolated set.
 */
export function createExperimentsClient(config: ExperimentsClientConfig = {}): ExperimentsClient {
  const store = createExperimentsStore({ onCollision: config.onCollision })

  return {
    snapshot: store.getSnapshot,
    getSnapshot: store.getSnapshot,
    get: store.get,
    subscribe: store.subscribe,
    clear: store.clear,

    set(name, override) {
      store.set(name, override)
    },

    toHeaders() {
      const map = store.getSnapshot()
      const headers: Record<string, string> = {}
      if (Object.keys(map).length > 0) {
        headers[EXPERIMENTS_HEADER_NAME] = serializeExperimentsHeader(map)
      }
      return headers
    },

    absorb(response) {
      const raw = response.headers?.get(EXPERIMENTS_HEADER_NAME)
      if (!raw) {
        return
      }
      store.merge(parseExperimentsHeader(raw))
    },
  }
}

let sharedClient: ExperimentsClient | undefined
let configuredReporter: ExperimentCollisionReporter | undefined

/**
 * The process-wide experiments client. Both ends of the cable default to this instance —
 * the fetch client reads its `toHeaders`/`absorb`, and the React hooks read/write it — so
 * a contributed experiment automatically rides along on requests with zero app wiring.
 * Created lazily; collision reporting routes through whatever `configureExperiments` set,
 * even if configured after first use.
 */
export function getExperimentsClient(): ExperimentsClient {
  if (!sharedClient) {
    sharedClient = createExperimentsClient({
      onCollision: (collision) => (configuredReporter ?? defaultCollisionReporter)(collision),
    })
  }
  return sharedClient
}

/**
 * Attach app-level configuration (today: the collision telemetry sink) to the shared client.
 * Call once at app startup. Safe to call before or after the client is first used.
 */
export function configureExperiments(config: ExperimentsClientConfig): void {
  configuredReporter = config.onCollision
}
