/**
 * The routing backend behind the adapter.
 *
 * The adapter's quote handler does NOT compute routes itself — it delegates to the
 * HookSwap smart-order-router. Two modes are defined behind one interface:
 *
 *   (A) PROXY mode  [IMPLEMENTED] — HTTP GET the deployed HooksOS/routing-api `/quote`
 *       endpoint (env ROUTING_API_URL) and return its native classic response, which
 *       translate.ts maps into the Trading API shape. This is the intended production wiring
 *       (see routing-api/hookswap/README.md §6 option B).
 *
 *   (B) EMBED mode  [IMPLEMENTED] — imports @uniswap/smart-order-router (HooksOS fork) and runs
 *       AlphaRouter in-process. Heavier (bundles the SOR + ethers + per-chain providers) but
 *       removes the routing-api hop. Fully implemented in ./embedRouter.ts and wired below
 *       (ROUTING_MODE=embed). Only requires `npm install` of the deps already in package.json.
 *
 * If no backend is configured, quoteExactRoute returns `undefined` and the handler returns a
 * proper Trading-API-shaped 404 — NEVER a fabricated price.
 */

import fetch from 'cross-fetch'
import type { ChainConfig } from './chains'
import { EmbedRoutingProvider } from './embedRouter'

/**
 * The classic routing-api `/quote` response shape (the subset we consume).
 * Source: @uniswap/routing-api GET /quote (RoutingApiQuoteResponse). Its `route` pool objects
 * are already the same v2/v3 pool shapes the Trading API uses, so translation is mostly 1:1.
 */
export interface RoutingApiPoolInRoute {
  type: 'v2-pool' | 'v3-pool'
  address: string
  tokenIn: { chainId: number; decimals: string; address: string; symbol?: string }
  tokenOut: { chainId: number; decimals: string; address: string; symbol?: string }
  // v3
  sqrtRatioX96?: string
  liquidity?: string
  tickCurrent?: string
  fee?: string
  // v2
  reserve0?: { token: { address: string }; quotient: string }
  reserve1?: { token: { address: string }; quotient: string }
  amountIn?: string
  amountOut?: string
}

export interface RoutingApiQuoteResponse {
  quoteId?: string
  /** raw base-unit quote amount */
  quote: string
  quoteDecimals?: string
  quoteGasAdjusted?: string
  gasUseEstimate?: string
  gasUseEstimateUSD?: string
  gasPriceWei?: string
  blockNumber?: string
  route: RoutingApiPoolInRoute[][]
  routeString?: string
  /** present when the request asked routing-api to build calldata */
  methodParameters?: { calldata: string; value: string; to: string }
}

export interface QuoteExactRouteParams {
  chain: ChainConfig
  tokenInAddress: string
  tokenOutAddress: string
  /** 'exactIn' | 'exactOut' */
  tradeType: 'exactIn' | 'exactOut'
  /** raw base-unit amount */
  amount: string
  protocols: Array<'v2' | 'v3'>
  recipient?: string
  slippageTolerancePct?: number
  deadlineSeconds?: number
}

export interface RoutingProvider {
  readonly mode: 'proxy' | 'embed' | 'none'
  /**
   * Returns a classic routing-api quote, or `undefined` if no route was found or no backend
   * is configured. Throws only on unexpected transport errors (surfaced as a 500).
   */
  quoteExactRoute(params: QuoteExactRouteParams): Promise<RoutingApiQuoteResponse | undefined>
}

// ---------------------------------------------------------------------------
// (A) PROXY provider — calls a deployed routing-api /quote
// ---------------------------------------------------------------------------

class ProxyRoutingProvider implements RoutingProvider {
  readonly mode = 'proxy' as const
  constructor(private readonly baseUrl: string) {}

  async quoteExactRoute(params: QuoteExactRouteParams): Promise<RoutingApiQuoteResponse | undefined> {
    const q = new URLSearchParams({
      tokenInAddress: params.tokenInAddress,
      tokenInChainId: String(params.chain.chainId),
      tokenOutAddress: params.tokenOutAddress,
      tokenOutChainId: String(params.chain.chainId),
      amount: params.amount,
      type: params.tradeType,
      protocols: params.protocols.join(','),
    })
    // Ask routing-api to also assemble Universal Router calldata when we know the recipient.
    if (params.recipient) {
      q.set('recipient', params.recipient)
      q.set('enableUniversalRouter', 'true')
      if (params.slippageTolerancePct != null) q.set('slippageTolerance', String(params.slippageTolerancePct))
      if (params.deadlineSeconds != null) q.set('deadline', String(params.deadlineSeconds))
    }

    const url = `${this.baseUrl.replace(/\/$/, '')}/quote?${q.toString()}`
    const res = await fetch(url, { method: 'GET', headers: { accept: 'application/json' } })

    if (res.status === 404) return undefined // routing-api's "no route found"
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`routing-api ${res.status}: ${body.slice(0, 500)}`)
    }
    return (await res.json()) as RoutingApiQuoteResponse
  }
}

// ---------------------------------------------------------------------------
// (B) EMBED provider — in-process AlphaRouter. Implemented in ./embedRouter.ts
// (heavy import: @uniswap/smart-order-router fork + sdk-core fork + ethers v5),
// kept out of this module so PROXY/NONE paths don't pull the SOR at import time.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// (none) — no backend configured
// ---------------------------------------------------------------------------

class NullRoutingProvider implements RoutingProvider {
  readonly mode = 'none' as const
  async quoteExactRoute(): Promise<RoutingApiQuoteResponse | undefined> {
    return undefined
  }
}

/** Selects the provider from env. ROUTING_API_URL → proxy; ROUTING_MODE=embed → embed; else none. */
export function createRoutingProvider(): RoutingProvider {
  const routingApiUrl = process.env.ROUTING_API_URL?.trim()
  const mode = process.env.ROUTING_MODE?.trim().toLowerCase()

  if (mode === 'embed') return new EmbedRoutingProvider()
  if (routingApiUrl) return new ProxyRoutingProvider(routingApiUrl)
  return new NullRoutingProvider()
}
