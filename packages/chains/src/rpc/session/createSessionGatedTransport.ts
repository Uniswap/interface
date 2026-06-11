import { gated, isSessionAuthFailureStatus, type Session } from '@universe/sessions'
import { logger as defaultLogger, type Logger } from 'utilities/src/logger/logger'
import { Chain, ClientConfig, EIP1193RequestFn, HttpRequestError, Transport, TransportConfig } from 'viem'

interface CreateSessionGatedTransportOptions {
  baseTransportFactory: Transport
  getSession: () => Session | null
  /** Identifier for telemetry, e.g. `unirpc-viem`. */
  source: string
  getLogger?: () => Logger
}

/**
 * Wraps a viem Transport with session gating:
 *
 *   await session.ready()
 *   call inner.request
 *   on HttpRequestError(status=401|403) → session.recover() → retry once
 *
 * The bootstrap check happens inside `getSession` per request — when the
 * getter returns null, the wrapper passes through to the inner transport
 * unchanged.
 *
 * Why Transport-level (not fetch-level): viem's `http` transport doesn't
 * accept a custom fetch function. The `onFetchRequest`/`onFetchResponse`
 * hooks can't restart a request after seeing a 401 response. Wrapping at
 * the Transport level is the cleanest way to retry-after-recover.
 *
 * The ready → recover → retry-once policy and its `SessionGate.*` telemetry
 * are delegated to `gated()` in `@universe/sessions`, so there's one source
 * of truth for the gate's behavior and Datadog events stay identical across
 * every transport (Connect, fetch, viem).
 */
export function createSessionGatedTransport({
  baseTransportFactory,
  getSession,
  source,
  getLogger = (): Logger => defaultLogger,
}: CreateSessionGatedTransportOptions): Transport {
  return (<chain extends Chain | undefined = Chain>(config: {
    chain?: chain
    pollingInterval?: ClientConfig['pollingInterval']
    retryCount?: TransportConfig['retryCount']
    timeout?: TransportConfig['timeout']
  }) => {
    const baseTransport = baseTransportFactory(config)

    const request: EIP1193RequestFn = (async (args: Parameters<EIP1193RequestFn>[0]) => {
      const session = getSession()
      if (!session) return baseTransport.request(args)

      return gated({
        session,
        call: () => baseTransport.request(args),
        isUnauthError: (err) => err instanceof HttpRequestError && isSessionAuthFailureStatus(err.status),
        source,
        getLogger,
      })
    }) as EIP1193RequestFn

    return {
      ...baseTransport,
      request,
      value: undefined,
    }
  }) as Transport
}
