/**
 * DataApiService method handlers for the HookSwap data-api.
 *
 * REAL (Phase 1, live on-chain reads):
 *   - listTokens   → each requested chain's native + wrapped-native + seeded ERC-20s.
 *   - listTopPools → each requested chain's live v2 pools (CREATE2-discovered, real reserves).
 *
 * STUBS (valid empty proto responses, NOT errors — so the interface degrades gracefully):
 *   - everything else (portfolio, wallet balances, transactions, positions, charts, rewards,
 *     protocol stats, token prices, RWAs, token-factory, reports, ...). These need the Phase-2
 *     event indexer / a USD price oracle, which don't exist yet. Returning an empty-but-valid
 *     Message keeps the frontend from crashing (it renders honest empty/"—" states).
 *
 * NO FABRICATED DATA: value/USD/volume fields we can't source truthfully are left unset (proto
 * default / undefined), never invented. See the pricing note in onchain.ts.
 */

import type { ServiceImpl } from '@connectrpc/connect'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import {
  ListTokensRequest,
  ListTokensResponse,
  ListTopPoolsRequest,
  ListTopPoolsResponse,
} from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { Pool, Token, TokenType } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { getChain, isSupportedChain, supportedChainIds } from './chains'
import { getV2Pairs, TokenMeta, V2PairData } from './onchain'

/** Uniswap v2 fixed swap fee = 0.30%, expressed in pips (hundredths of a bip) as the proto expects. */
const V2_FEE_TIER_PIPS = 3000

/**
 * Tiny TTL cache so repeated Markets/token-picker requests don't hammer the public RPC.
 * Current-state only; a short TTL keeps reserves reasonably fresh without a DB.
 */
const POOLS_TTL_MS = 15_000
const poolsCache = new Map<number, { at: number; data: V2PairData[] }>()

async function getV2PairsCached(chainId: number): Promise<V2PairData[]> {
  const hit = poolsCache.get(chainId)
  const now = Date.now()
  if (hit && now - hit.at < POOLS_TTL_MS) {
    return hit.data
  }
  const data = await getV2Pairs(chainId)
  poolsCache.set(chainId, { at: now, data })
  return data
}

/** Resolve which supported chains a request targets: its chainIds, or all supported if none given. */
function resolveChainIds(requested: number[]): number[] {
  const ids = requested.length ? requested : supportedChainIds()
  return ids.filter(isSupportedChain)
}

/** data.v1.Token for a wrapped-native or seeded ERC-20 (real metadata; ERC-20 type). */
function toProtoErc20Token(meta: TokenMeta): Token {
  return new Token({
    chainId: meta.chainId,
    address: meta.address,
    symbol: meta.symbol,
    name: meta.name,
    decimals: meta.decimals,
    type: TokenType.ERC20,
    // metadata/stats intentionally omitted: no logo registry, no USD price oracle, no volume
    // indexer yet. Leaving them unset renders honest "—"/empty in the UI (no fabricated values).
  })
}

// ---------- REAL: listTokens ----------

async function handleListTokens(req: ListTokensRequest): Promise<ListTokensResponse> {
  const chainIds = resolveChainIds(req.chainIds)
  const tokens: Token[] = []

  for (const chainId of chainIds) {
    const chain = getChain(chainId)
    if (!chain) {
      continue
    }
    // Native asset. NO on-chain contract, so `address` is left empty (the native sentinel) and
    // type = NATIVE. We do not invent a contract address for it.
    tokens.push(
      new Token({
        chainId,
        address: '',
        symbol: chain.nativeSymbol,
        name: chain.nativeSymbol,
        decimals: chain.nativeDecimals,
        type: TokenType.NATIVE,
      }),
    )
    // Wrapped-native (real ERC-20).
    tokens.push(
      toProtoErc20Token({
        chainId,
        address: chain.wrappedNative.address,
        symbol: chain.wrappedNative.symbol,
        name: chain.wrappedNative.name,
        decimals: chain.wrappedNative.decimals,
        isWrappedNative: true,
      }),
    )
    // Seeded tokens (real, verified ERC-20s).
    for (const t of chain.seededTokens ?? []) {
      tokens.push(
        toProtoErc20Token({ chainId, address: t.address, symbol: t.symbol, name: t.name, decimals: t.decimals, isWrappedNative: false }),
      )
    }
  }

  return new ListTokensResponse({ tokens, nextPageToken: '', multichainTokens: [] })
}

// ---------- REAL: listTopPools ----------

async function handleListTopPools(req: ListTopPoolsRequest): Promise<ListTopPoolsResponse> {
  const chainIds = resolveChainIds(req.chainIds)
  const pools: Pool[] = []

  const perChain = await Promise.all(
    chainIds.map(async (chainId) => {
      try {
        return await getV2PairsCached(chainId)
      } catch {
        // A chain's RPC being down must not fail the whole response — serve the chains that answer.
        return [] as V2PairData[]
      }
    }),
  )

  for (const chainPairs of perChain) {
    for (const p of chainPairs) {
      pools.push(
        new Pool({
          chainId: p.chainId,
          poolId: p.pairAddress,
          token0: toProtoErc20Token(p.token0),
          token1: toProtoErc20Token(p.token1),
          protocolVersion: ProtocolVersion.V2,
          feeTier: V2_FEE_TIER_PIPS,
          isDynamicFee: false,
          // stats (tvl / volume / apr) intentionally OMITTED: TVL needs a USD price oracle and
          // volume/APR need a historical event indexer — neither exists in Phase 1. The pool
          // itself (tokens, fee, existence) is real, on-chain-verified; value metrics render "—".
        }),
      )
    }
  }

  return new ListTopPoolsResponse({ pools, nextPageToken: '' })
}

// ---------- Build the full ServiceImpl: 2 real handlers + honest empty stubs for the rest ----------

/**
 * Every DataApiService method must be implemented for the Connect router. We implement listTokens
 * and listTopPools for real, and auto-generate an empty-response stub for every other method by
 * instantiating that method's response Message class (`methodInfo.O`) with no args — always a valid,
 * empty proto response. This is intentionally NOT an error/unimplemented: the interface treats an
 * empty response as "no data" and shows honest empty states rather than crashing.
 */
export function createDataApiImpl(): ServiceImpl<typeof DataApiService> {
  const impl: Record<string, (...args: unknown[]) => unknown> = {}

  for (const [methodName, methodInfo] of Object.entries(DataApiService.methods)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    impl[methodName] = () => new (methodInfo as any).O()
  }

  // Real implementations override the stubs.
  impl.listTokens = (req: unknown) => handleListTokens(req as ListTokensRequest)
  impl.listTopPools = (req: unknown) => handleListTopPools(req as ListTopPoolsRequest)

  return impl as unknown as ServiceImpl<typeof DataApiService>
}
