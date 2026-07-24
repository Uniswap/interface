// oxlint-disable eslint-js/no-restricted-syntax -- Node-side Playwright code: process.env is the config surface here (no app getConfig())
// oxlint-disable no-restricted-imports -- the headless (node:fs) sessions entry is deliberately not exported from the package root to keep it out of app bundle graphs; this file never enters them
/**
 * Uni RPC fork source for anvil e2e tests (Node-side Playwright code).
 *
 * Behind the `ANVIL_FORK_VIA_UNIRPC` env flag (default OFF), anvil forks through the
 * uni RPC entry gateway instead of PublicNode: a session is bootstrapped via the
 * headless session client (persisted to `~/.uniswap/session.json`, so relaunches reuse
 * it) and the session headers ride on every upstream fork request via anvil's
 * `--fork-header` flag.
 *
 * The local shell flow (scripts/start-anvil.sh) reuses this provider through
 * scripts/anvil-spawn-args.ts, so both flows share one implementation.
 */
import type { HeadlessSessionClient } from '@universe/sessions/src/headless'
import { createHeadlessSessionClient, DEFAULT_GATEWAY_BASE_URL } from '@universe/sessions/src/headless'

/** Everything anvil needs to fork: upstream URL plus per-request headers. */
interface AnvilForkSource {
  forkUrl: string
  /** Extra headers for upstream fork requests (`--fork-header`). Empty for unauthenticated sources. */
  forkHeaders: Record<string, string>
}

/**
 * Async fork-source seam for the anvil manager: resolved fresh on every (re)launch so a
 * relaunch can pick up refreshed credentials. `kind` exists for flag-routing assertions.
 */
interface ForkSourceProvider {
  kind: 'static' | 'unirpc'
  getForkSource(): Promise<AnvilForkSource>
  /** Refreshes credentials after an upstream 401. No-op for static (unauthenticated) sources. */
  recover(): Promise<void>
}

function isUnirpcForkEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const value = env.ANVIL_FORK_VIA_UNIRPC?.toLowerCase()
  return value === '1' || value === 'true'
}

/** Entry-gateway base URL for uni RPC forking. Default: staging (prod comes with the CI flip). */
function resolveUnirpcGatewayBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.ANVIL_UNIRPC_GATEWAY_URL?.trim()
  return (configured ? configured : DEFAULT_GATEWAY_BASE_URL).replace(/\/+$/, '')
}

/** A fixed, unauthenticated fork source (the PublicNode default path). */
function createStaticForkSourceProvider(forkUrl: string): ForkSourceProvider {
  return {
    kind: 'static',
    getForkSource: async (): Promise<AnvilForkSource> => ({ forkUrl, forkHeaders: {} }),
    recover: async (): Promise<void> => {},
  }
}

/**
 * Session-authenticated fork source through the uni RPC entry gateway.
 * The headless client persists the session via its default file store, so repeated
 * anvil launches (and separate Playwright workers) reuse one session.
 */
function createUnirpcForkSourceProvider(ctx?: {
  chainId?: number
  env?: NodeJS.ProcessEnv
  /** Session client seam for tests. Default: a real headless client against the gateway. */
  sessionClient?: HeadlessSessionClient
}): ForkSourceProvider {
  const env = ctx?.env ?? process.env
  const chainId = ctx?.chainId ?? 1
  const gatewayBaseUrl = resolveUnirpcGatewayBaseUrl(env)
  const sessionClient = ctx?.sessionClient ?? createHeadlessSessionClient({ gatewayBaseUrl })

  return {
    kind: 'unirpc',
    async getForkSource(): Promise<AnvilForkSource> {
      const headers = await sessionClient.getSessionHeaders()
      return {
        forkUrl: `${gatewayBaseUrl}/rpc/${chainId}`,
        forkHeaders: { ...headers },
      }
    },
    async recover(): Promise<void> {
      await sessionClient.recover()
    },
  }
}

/**
 * Formats a fork source as anvil CLI args: `--fork-url <url>` plus one
 * `--fork-header "Key: value"` per header.
 */
function buildForkArgs(source: AnvilForkSource): string[] {
  const args = ['--fork-url', source.forkUrl]
  for (const [name, value] of Object.entries(source.forkHeaders)) {
    args.push('--fork-header', `${name}: ${value}`)
  }
  return args
}

/**
 * Flag routing for the anvil manager: uni RPC provider when `ANVIL_FORK_VIA_UNIRPC` is
 * on, otherwise a static provider for `defaultForkUrl` (the PublicNode default path).
 */
function resolveForkSourceProvider(ctx: {
  defaultForkUrl: string
  chainId?: number
  env?: NodeJS.ProcessEnv
}): ForkSourceProvider {
  if (isUnirpcForkEnabled(ctx.env)) {
    return createUnirpcForkSourceProvider({ chainId: ctx.chainId, env: ctx.env })
  }
  return createStaticForkSourceProvider(ctx.defaultForkUrl)
}

type ForkAuthProbeResult = 'ok' | 'unauthorized' | 'unreachable'

/**
 * Cheap authenticated probe of the upstream fork source: one `eth_blockNumber` with the
 * fork headers. Only a definitive HTTP 401 reports `unauthorized` — transient upstream
 * errors (5xx, network) must not trigger a relaunch.
 */
async function probeForkAuth(
  source: AnvilForkSource,
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<ForkAuthProbeResult> {
  try {
    const response = await fetchFn(source.forkUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...source.forkHeaders },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }),
    })
    return response.status === 401 ? 'unauthorized' : 'ok'
  } catch {
    return 'unreachable'
  }
}

/**
 * Relaunch decision for the ensureHealthy()/test-boundary auth check: relaunch anvil with
 * fresh headers only on a definitive 401 from the upstream (an expired/revoked session).
 */
function shouldRelaunchForAuth(probe: ForkAuthProbeResult): boolean {
  return probe === 'unauthorized'
}

export {
  buildForkArgs,
  createUnirpcForkSourceProvider,
  isUnirpcForkEnabled,
  probeForkAuth,
  resolveForkSourceProvider,
  resolveUnirpcGatewayBaseUrl,
  shouldRelaunchForAuth,
}
export type { AnvilForkSource, ForkAuthProbeResult, ForkSourceProvider }
