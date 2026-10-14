import { TradingApi } from '@universe/api'
import { Platform, type UniverseChainId } from '@universe/chains'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import {
  buildCurrencyId,
  buildNativeCurrencyId,
  currencyIdToAddress,
  isDefaultNativeAddress,
  normalizeCurrencyIdForMapLookup,
} from 'uniswap/src/utils/currencyId'
import { getPoolDetailsURL, getTokenDetailsURL } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'

export interface RouteDiagramNode {
  /** `${tokenKey}#${visit}`: a token the route passes through more than once is one node per visit. */
  id: string
  /** Normalized currency id, shared by every visit of the token; keys its logo and colour. */
  tokenKey: string
  currencyId: string
  symbol: string
}

export interface RouteDiagramLink {
  id: string
  source: string
  target: string
  /** Share of the trade's input value routed through this pool, in bps; sizes the ribbon. */
  shareBps: number
  protocol: TradingApi.RouteGraphPool.protocol
  /** V2/V3 pool address or V4 pool id; absent for WRAP. */
  poolAddress?: string
  hooks?: string
  /** Fee in hundredths of a bip (3000 = 0.3%); absent for WRAP and dynamic-fee pools. */
  feePips?: number
  isDynamicFee: boolean
  /** GuideStar quotes only; uniroute carries no USD amounts. */
  usdIn?: number
  usdOut?: number
}

export interface RouteDiagram {
  nodes: RouteDiagramNode[]
  links: RouteDiagramLink[]
}

function toCurrencyId({
  token,
  chainId,
}: {
  token: TradingApi.TokenInRoute
  chainId: UniverseChainId
}): string | undefined {
  if (!token.address) {
    return undefined
  }
  return isDefaultNativeAddress({ address: token.address, platform: Platform.EVM })
    ? buildNativeCurrencyId(chainId)
    : buildCurrencyId(chainId, token.address)
}

function toNumber(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

/**
 * The diagram model for a quote's `routeGraph`. The Trading API guarantees the graph is whole (shares
 * reconcile, tokens resolved by address, no cycles) or absent, so this only reshapes it; undefined means the
 * Route row keeps its classic diagram.
 */
export function buildRouteDiagram({
  routeGraph,
  chainId,
}: {
  routeGraph: TradingApi.RouteGraph | undefined
  chainId: UniverseChainId
}): RouteDiagram | undefined {
  if (!routeGraph?.pools.length) {
    return undefined
  }
  const nodes = new Map<string, RouteDiagramNode>()
  const addNode = (token: TradingApi.TokenInRoute, visit: number | undefined): string | undefined => {
    const currencyId = toCurrencyId({ token, chainId })
    if (!currencyId) {
      return undefined
    }
    const tokenKey = normalizeCurrencyIdForMapLookup(currencyId)
    const id = `${tokenKey}#${visit ?? 0}`
    if (!nodes.has(id)) {
      const symbol = token.symbol ?? shortenAddress({ address: currencyIdToAddress(currencyId) })
      nodes.set(id, { id, tokenKey, currencyId, symbol })
    }
    return id
  }

  const links: RouteDiagramLink[] = []
  for (const pool of routeGraph.pools) {
    const source = addNode(pool.tokenIn, pool.tokenInVisit)
    const target = addNode(pool.tokenOut, pool.tokenOutVisit)
    if (!source || !target) {
      return undefined
    }
    links.push({
      id: `${pool.protocol}:${pool.address ?? ''}:${source}>${target}`,
      source,
      target,
      shareBps: pool.shareOfInputBps,
      protocol: pool.protocol,
      poolAddress: pool.address,
      hooks: pool.hooks,
      feePips: toNumber(pool.fee),
      isDynamicFee: pool.isDynamicFee ?? false,
      usdIn: toNumber(pool.usdIn),
      usdOut: toNumber(pool.usdOut),
    })
  }
  return { nodes: [...nodes.values()], links }
}

/** Token page a click on a node opens. */
export function getRouteDiagramTokenHref({
  node,
  chainId,
}: {
  node: RouteDiagramNode
  chainId: UniverseChainId
}): string {
  return getTokenDetailsURL({
    address: currencyIdToAddress(node.currencyId),
    chain: chainId,
    chainUrlParam: getChainInfo(chainId).urlParam,
  })
}

const POOL_PROTOCOLS: ReadonlySet<TradingApi.RouteGraphPool.protocol> = new Set([
  TradingApi.RouteGraphPool.protocol.V2,
  TradingApi.RouteGraphPool.protocol.V3,
  TradingApi.RouteGraphPool.protocol.V4,
])

/** Pool page a click on a ribbon opens; undefined for WRAP and unknown protocols, which have no pool page. */
export function getRouteDiagramPoolHref({
  link,
  chainId,
}: {
  link: RouteDiagramLink
  chainId: UniverseChainId
}): string | undefined {
  return link.poolAddress && POOL_PROTOCOLS.has(link.protocol)
    ? getPoolDetailsURL(link.poolAddress, chainId)
    : undefined
}
