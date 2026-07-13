import { requireSessionFetch, SessionGateSource, type Session } from '@universe/sessions'
import { providers as ethersProviders } from 'ethers/lib/ethers'
import { logger } from 'utilities/src/logger/logger'
import { SignerInfo } from './FlashbotsCommon'
import { FlashbotsRpcProvider } from './FlashbotsRpcProvider'
import { extractRpcErrorMeta } from './observability/extractRpcErrorMeta'
import { InstrumentedJsonRpcProvider } from './observability/InstrumentedJsonRpcProvider'
import { normalizeRpcError } from './observability/normalizeRpcError'
import { generateRequestId, getRpcObserver, type RpcObserver } from './observability/rpcObserver'
import type { RpcConfigResolver } from './resolveRpcConfig'
import { RPCType, UniverseChainId } from './types'
import { HEADER_RESOLVE_TIMEOUT_MS, withTimeout } from './withTimeout'

interface CreateEthersProviderFactoryCtx {
  resolveRpcConfig: RpcConfigResolver
  /**
   * Optional per-request session gate. When the getter returns a Session,
   * UniRPC traffic awaits ready and retries once on 401. When null, passes
   * through.
   */
  getSessionGate?: () => Session | null
}

interface CreateEthersProviderInput {
  chainId: UniverseChainId
  rpcType: RPCType
  signerInfo?: SignerInfo
}

export type CreateEthersProvider = (input: CreateEthersProviderInput) => ethersProviders.JsonRpcProvider | null

/**
 * Creates a JsonRpcFetchFunc for use with ethers v5's Web3Provider.
 * Handles the full JSON-RPC envelope: builds the request, injects dynamic headers
 * per-request, and parses the response. Emits observer events around each fetch
 * so UniRPC requests are visible in the same RPC telemetry as legacy paths.
 *
 * This is the ethers equivalent of viem's `onFetchRequest` — a transport-level
 * hook that resolves auth headers before each fetch.
 */
function createJsonRpcFetchFunc(config: {
  rpcUrl: string
  chainId: number
  headers?: Record<string, string>
  getRequestHeaders: () => Promise<Record<string, string>>
  observer: RpcObserver
  getSessionGate?: () => Session | null
}): ethersProviders.JsonRpcFetchFunc {
  let nextId = 1
  // No-op when getSessionGate returns null (not bootstrapped); awaits ready
  // and retries once on 401 otherwise. Emits SessionGate.* events to DD.
  const getSession = config.getSessionGate ?? ((): null => null)
  const doFetch = requireSessionFetch({
    getSession,
    source: SessionGateSource.UnirpcEthers,
    getLogger: (): typeof logger => logger,
  })(fetch)

  return async (method: string, params?: Array<unknown>): Promise<unknown> => {
    const requestId = generateRequestId()
    const ctx = {
      requestId,
      method,
      params,
      chainId: config.chainId,
      url: config.rpcUrl,
      transport: 'ethers' as const,
    }
    config.observer.onRequest(ctx)
    const start = performance.now()

    try {
      // Bound header resolution so a hung session/device-id provider can't
      // hang the fetch indefinitely. Without this, mobile/extension would
      // freeze on storage failures with no error surfacing.
      const dynamicHeaders = await withTimeout(config.getRequestHeaders(), {
        timeoutMs: HEADER_RESOLVE_TIMEOUT_MS,
        label: 'getRequestHeaders',
      })
      const response = await doFetch(config.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
          ...dynamicHeaders,
        },
        body: JSON.stringify({ jsonrpc: '2.0', method, params, id: nextId++ }),
      })

      if (!response.ok) {
        // Carry the status as a structured field, not just in the message:
        // on React Native `response.statusText` is empty, so the message alone
        // ("RPC request failed: 403 ") isn't reliably parseable. extractRpcErrorMeta
        // reads `.status` directly (with the message as a fallback).
        const httpError = new Error(`RPC request failed: ${response.status} ${response.statusText}`.trim()) as Error & {
          status?: number
        }
        httpError.status = response.status
        throw httpError
      }

      const json = (await response.json()) as {
        result?: unknown
        error?: { code?: number; data?: unknown; message?: string }
      }
      if (json.error) {
        const error = new Error(json.error.message) as Error & { code?: number; data?: unknown }
        error.code = json.error.code
        error.data = json.error.data
        throw error
      }
      config.observer.onResponse({ ...ctx, durationMs: performance.now() - start })
      return json.result
    } catch (error) {
      // Normalize before handing to the observer so the rate limiter's
      // bucket-by-message strategy stays effective; extract status/code from the
      // raw error (the non-ok branch attaches `.status`, the JSON-RPC branch
      // attaches `.code`). Throw the original.
      config.observer.onError({
        ...ctx,
        durationMs: performance.now() - start,
        error: normalizeRpcError(error),
        ...extractRpcErrorMeta(error),
      })
      throw error
    }
  }
}

export function createEthersProviderFactory(ctx: CreateEthersProviderFactoryCtx): CreateEthersProvider {
  return (input: CreateEthersProviderInput): ethersProviders.JsonRpcProvider | null => {
    try {
      const rpcConfig = ctx.resolveRpcConfig({ chainId: input.chainId, rpcType: input.rpcType })
      if (!rpcConfig) {
        return null
      }

      if (rpcConfig.shouldUseFlashbots && rpcConfig.flashbotsConfig) {
        const { refundPercent, calldataHintsEnabled } = rpcConfig.flashbotsConfig
        return new FlashbotsRpcProvider({
          signerInfo: input.signerInfo,
          refundPercent,
          calldataHintsEnabled,
          network: input.chainId,
        })
      }

      // Branch on the explicit `isUniRpc` flag (like createViemClient), not header
      // presence, so the session-gated path is chosen consistently across transports.
      if (rpcConfig.isUniRpc && rpcConfig.getRequestHeaders) {
        // ethers v5 JsonRpcProvider only accepts string | ConnectionInfo — it
        // doesn't take a JsonRpcFetchFunc. Web3Provider is the provider that
        // wraps a fetch function, so it's the right tool despite its name.
        // The fetch function emits observer events so this path is visible in
        // RPC telemetry alongside legacy providers.
        return new ethersProviders.Web3Provider(
          createJsonRpcFetchFunc({
            rpcUrl: rpcConfig.rpcUrl,
            chainId: input.chainId,
            headers: rpcConfig.headers,
            getRequestHeaders: rpcConfig.getRequestHeaders,
            observer: getRpcObserver(),
            getSessionGate: ctx.getSessionGate,
          }),
          input.chainId,
        )
      }

      return new InstrumentedJsonRpcProvider({
        url: rpcConfig.rpcUrl,
        headers: rpcConfig.headers,
        credentials: rpcConfig.credentials,
        chainIdOrNetwork: input.chainId,
        observer: getRpcObserver(),
      })
    } catch (error) {
      logger.error(error, {
        tags: { file: 'createEthersProvider', function: 'createProvider' },
        extra: { chainId: input.chainId, rpcType: input.rpcType },
      })
      return null
    }
  }
}
