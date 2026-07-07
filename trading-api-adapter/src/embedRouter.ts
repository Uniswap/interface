/**
 * EMBED routing — in-process smart-order-router (HookSwap fork of @uniswap/smart-order-router).
 *
 * Computes routes directly against the deployed HookSwap v2/v3 pools + per-chain RPC, and maps
 * the SOR `SwapRoute` into the classic routing-api response shape (`RoutingApiQuoteResponse`) so
 * `translate.ts` maps it to the Trading API shape unchanged — exactly like PROXY mode, minus the
 * routing-api hop.
 *
 * Requires (see package.json + the fork override): `@uniswap/smart-order-router` (fork, which
 * carries the deployed factory/quoter/router addresses for chainIds 999/4663/4326/57073/196/4217),
 * `@uniswap/sdk-core` (fork, which defines those ChainIds), and `ethers@^5`.
 *
 * Returns `undefined` when no route is found (→ the handler emits a Trading-API 404 NO_ROUTE_FOUND).
 * Never fabricates a price.
 */
import {
  AlphaRouter,
  StaticV2SubgraphProvider,
  StaticV3SubgraphProvider,
  SwapType,
  UniswapMulticallProvider,
  V3PoolProvider,
  type SwapRoute,
  type SwapOptions,
} from '@uniswap/smart-order-router'
import { CurrencyAmount, Percent, Token, TradeType, type Currency } from '@uniswap/sdk-core'
import { Protocol } from '@uniswap/router-sdk'
import { ethers } from 'ethers'
import type { ChainConfig } from './chains'
import { resolveRpcUrl } from './chains'
import type {
  QuoteExactRouteParams,
  RoutingApiPoolInRoute,
  RoutingApiQuoteResponse,
  RoutingProvider,
} from './routingClient'

const ERC20_DECIMALS_ABI = ['function decimals() view returns (uint8)', 'function symbol() view returns (string)']

/** Native sentinels the interface/Trading-API use for "the chain's native currency". */
const NATIVE_ADDRESSES = new Set([
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  '0x0000000000000000000000000000000000000000',
  'eth',
  'native',
])

function isNativeAddress(address: string): boolean {
  return NATIVE_ADDRESSES.has(address.toLowerCase())
}

interface ChainContext {
  router: AlphaRouter
  provider: ethers.providers.JsonRpcProvider
}

export class EmbedRoutingProvider implements RoutingProvider {
  readonly mode = 'embed' as const

  private readonly chainContexts = new Map<number, ChainContext>()
  /** chainId → tokenAddress(lowercase) → decimals. On-chain reads are cached for the process. */
  private readonly decimalsCache = new Map<number, Map<string, number>>()

  private getChainContext(chain: ChainConfig): ChainContext {
    let ctx = this.chainContexts.get(chain.chainId)
    if (!ctx) {
      const provider = new ethers.providers.JsonRpcProvider(resolveRpcUrl(chain), chain.chainId)
      const multicall2Provider = new UniswapMulticallProvider(chain.chainId, provider)
      // HookSwap chains have no hosted subgraph — use static (on-chain-derived) pool
      // discovery so the router finds our deployed v2/v3 pools via the factory + bases.
      const v3PoolProvider = new V3PoolProvider(chain.chainId, multicall2Provider)
      const router = new AlphaRouter({
        chainId: chain.chainId,
        provider,
        multicall2Provider,
        v2SubgraphProvider: new StaticV2SubgraphProvider(chain.chainId),
        v3SubgraphProvider: new StaticV3SubgraphProvider(chain.chainId, v3PoolProvider),
      })
      ctx = { router, provider }
      this.chainContexts.set(chain.chainId, ctx)
    }
    return ctx
  }

  private async getDecimals(chain: ChainConfig, provider: ethers.providers.JsonRpcProvider, address: string): Promise<number> {
    const key = address.toLowerCase()
    let perChain = this.decimalsCache.get(chain.chainId)
    if (!perChain) {
      perChain = new Map()
      this.decimalsCache.set(chain.chainId, perChain)
    }
    const cached = perChain.get(key)
    if (cached !== undefined) {
      return cached
    }
    const erc20 = new ethers.Contract(address, ERC20_DECIMALS_ABI, provider)
    const decimals = Number(await erc20.decimals())
    perChain.set(key, decimals)
    return decimals
  }

  /** Build the SOR `Currency` for a token address on a chain (native → the chain's wrapped-native). */
  private async resolveCurrency(
    chain: ChainConfig,
    provider: ethers.providers.JsonRpcProvider,
    address: string,
  ): Promise<Currency> {
    // Route native through wrapped-native (v2/v3 pools hold WETH-equivalents). The Universal
    // Router unwraps on the way out; the interface handles native display.
    if (isNativeAddress(address)) {
      const wn = chain.wrappedNative
      return new Token(chain.chainId, wn.address, wn.decimals, wn.symbol, wn.name)
    }
    const decimals = await this.getDecimals(chain, provider, address)
    return new Token(chain.chainId, address, decimals)
  }

  async quoteExactRoute(params: QuoteExactRouteParams): Promise<RoutingApiQuoteResponse | undefined> {
    const { chain } = params
    const { router, provider } = this.getChainContext(chain)

    const [tokenIn, tokenOut] = await Promise.all([
      this.resolveCurrency(chain, provider, params.tokenInAddress),
      this.resolveCurrency(chain, provider, params.tokenOutAddress),
    ])

    const tradeType = params.tradeType === 'exactIn' ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT
    // For EXACT_INPUT the amount is denominated in tokenIn; for EXACT_OUTPUT in tokenOut.
    const amountCurrency = tradeType === TradeType.EXACT_INPUT ? tokenIn : tokenOut
    const quoteCurrency = tradeType === TradeType.EXACT_INPUT ? tokenOut : tokenIn
    const amount = CurrencyAmount.fromRawAmount(amountCurrency, params.amount)

    const protocols = params.protocols.map((p) => (p === 'v2' ? Protocol.V2 : Protocol.V3))

    // Only assemble swap calldata (Universal Router) when we know the recipient.
    let swapConfig: SwapOptions | undefined
    if (params.recipient) {
      swapConfig = {
        type: SwapType.UNIVERSAL_ROUTER,
        // UniversalRouterVersion.V2_0 ('2.0') — matches HookSwap's deployed UR
        // (supportedURVersions _2_0). Hardcoded to avoid importing universal-router-sdk
        // (whose dep chain fails to resolve from the interface node_modules at runtime).
        // Only read when assembling swap calldata; the quote path ignores it.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        version: '2.0' as any,
        recipient: params.recipient,
        slippageTolerance: new Percent(Math.round((params.slippageTolerancePct ?? 0.5) * 100), 10_000),
        deadlineOrPreviousBlockhash: Math.floor(Date.now() / 1000) + (params.deadlineSeconds ?? 1800),
      }
    }

    let route: SwapRoute | null
    try {
      route = await router.route(amount, quoteCurrency, tradeType, swapConfig, { protocols })
    } catch {
      // SOR throws on some no-liquidity / provider errors — treat as "no route" (honest 404).
      return undefined
    }
    if (!route) {
      return undefined
    }

    return mapSwapRouteToResponse(route, tradeType)
  }
}

/** Map an SOR `SwapRoute` into the classic routing-api response `translate.ts` already consumes. */
function mapSwapRouteToResponse(route: SwapRoute, tradeType: TradeType): RoutingApiQuoteResponse {
  const routes: RoutingApiPoolInRoute[][] = route.route.map((r) => {
    // Each `r` is a RouteWithValidQuote whose `.route.pools` (v3) or `.route.pairs` (v2) are the hops.
    const pools = (r.route as { pools?: unknown[]; pairs?: unknown[] }).pools ?? (r.route as { pairs?: unknown[] }).pairs ?? []
    return pools.map((pool) => poolToRoutePool(pool as Record<string, unknown>))
  })

  const quote = route.quote.quotient.toString()
  const quoteGasAdjusted = route.quoteGasAdjusted.quotient.toString()

  return {
    quoteId: undefined,
    quote,
    quoteDecimals: route.quote.currency.decimals.toString(),
    quoteGasAdjusted,
    gasUseEstimate: route.estimatedGasUsed.toString(),
    gasUseEstimateUSD: route.estimatedGasUsedUSD?.toExact?.(),
    gasPriceWei: route.gasPriceWei?.toString(),
    blockNumber: route.blockNumber?.toString(),
    route: routes,
    routeString: undefined,
    methodParameters: route.methodParameters
      ? {
          calldata: route.methodParameters.calldata,
          value: route.methodParameters.value,
          to: route.methodParameters.to,
        }
      : undefined,
  }
  // tradeType retained for callers/telemetry; response shape is symmetric for exactIn/exactOut.
  void tradeType
}

/** Map a single v2 Pair or v3 Pool into the classic `RoutingApiPoolInRoute` shape. */
function poolToRoutePool(pool: Record<string, unknown>): RoutingApiPoolInRoute {
  // v3 Pool has `fee` + `sqrtRatioX96` + `liquidity` + `tickCurrent`; v2 Pair has `reserve0/1`.
  const token0 = pool.token0 as { chainId: number; decimals: number; address: string; symbol?: string }
  const token1 = pool.token1 as { chainId: number; decimals: number; address: string; symbol?: string }
  const isV3 = pool.fee !== undefined || pool.sqrtRatioX96 !== undefined

  const base: RoutingApiPoolInRoute = {
    type: isV3 ? 'v3-pool' : 'v2-pool',
    address: (pool.address as string) ?? '',
    tokenIn: { chainId: token0.chainId, decimals: String(token0.decimals), address: token0.address, symbol: token0.symbol },
    tokenOut: { chainId: token1.chainId, decimals: String(token1.decimals), address: token1.address, symbol: token1.symbol },
  }

  if (isV3) {
    base.fee = pool.fee !== undefined ? String(pool.fee) : undefined
    base.sqrtRatioX96 = (pool.sqrtRatioX96 as { toString(): string } | undefined)?.toString()
    base.liquidity = (pool.liquidity as { toString(): string } | undefined)?.toString()
    base.tickCurrent = pool.tickCurrent !== undefined ? String(pool.tickCurrent) : undefined
  } else {
    const r0 = pool.reserve0 as { quotient?: { toString(): string } } | undefined
    const r1 = pool.reserve1 as { quotient?: { toString(): string } } | undefined
    if (r0?.quotient) {
      base.reserve0 = { token: { address: token0.address }, quotient: r0.quotient.toString() }
    }
    if (r1?.quotient) {
      base.reserve1 = { token: { address: token1.address }, quotient: r1.quotient.toString() }
    }
  }

  return base
}
