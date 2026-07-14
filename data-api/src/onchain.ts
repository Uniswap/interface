/**
 * On-chain readers for the HookSwap data-api (Phase 1: current-state only).
 *
 * Everything here is a LIVE read from the chain's public/hosted RPC via ethers v5 — no cache DB,
 * no historical data, no fabricated values.
 *
 * Pool discovery (getV2Pairs) unions TWO real on-chain sources and dedupes by pair address:
 *   1. Factory enumeration — `allPairsLength()` + `allPairs(i)`. This is the AUTHORITATIVE list of
 *      every v2 pair the chain's HookSwap factory has actually created, so it surfaces pools whose
 *      non-native token is NOT in our static `seededTokens` list (e.g. XLayer's on-chain HKT/WOKB
 *      pools, which would otherwise be invisible). Bounded by MAX_ENUMERATED_PAIRS.
 *   2. Seeded-set CREATE2 — for each {wrapped-native, seeded-token} combination we CREATE2-compute
 *      the canonical pair address. Cheap, needs no round-trips, and guarantees a curated pool is
 *      found even in the unlikely case enumeration is unavailable on a given RPC.
 * Each candidate is then verified with a live `getCode` / `getReserves()` / `token0()` / `token1()`;
 * pools with no code or zero reserves are skipped honestly (nothing to show / route). Token metadata
 * for enumerated (non-curated) tokens is read live on-chain via ERC-20 — never fabricated.
 */

import { BigNumber, ethers } from 'ethers'
import { ChainConfig, getChain, resolveRpcUrl, V2_PAIR_INIT_CODE_HASH } from './chains'

const ERC20_ABI = [
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
]
const PAIR_ABI = [
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() view returns (address)',
  'function token1() view returns (address)',
]
const V2_FACTORY_ABI = [
  'function allPairsLength() view returns (uint256)',
  'function allPairs(uint256) view returns (address)',
  'function getPair(address,address) view returns (address)',
]
// UniswapV3Factory has NO on-chain pool enumerator (no allPools()), so the only way to discover v3
// pools is to scan its `PoolCreated` event log. token0/token1/fee are indexed; tickSpacing/pool are
// in data. This is the canonical event (topic 0x783cca1c…, verified 2026-07-10 against ethers).
const V3_FACTORY_EVENT_ABI = [
  'event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)',
]
const v3FactoryIface = new ethers.utils.Interface(V3_FACTORY_EVENT_ABI)

const providerCache = new Map<number, ethers.providers.JsonRpcProvider>()

export function getProvider(chainId: number): ethers.providers.JsonRpcProvider {
  const cached = providerCache.get(chainId)
  if (cached) {
    return cached
  }
  const chain = getChain(chainId)
  if (!chain) {
    throw new Error(`unsupported chainId ${chainId}`)
  }
  // `chainId` passed to the provider avoids an extra eth_chainId round-trip on every call.
  const provider = new ethers.providers.JsonRpcProvider(resolveRpcUrl(chain), chainId)
  providerCache.set(chainId, provider)
  return provider
}

export interface TokenMeta {
  chainId: number
  address: string
  symbol: string
  name: string
  decimals: number
  /** true for the chain's wrapped-native token. */
  isWrappedNative: boolean
}

/** Build the static token registry (wrapped-native + seeded tokens) for a chain, keyed by lowercased address. */
function staticRegistry(chain: ChainConfig): Map<string, TokenMeta> {
  const reg = new Map<string, TokenMeta>()
  reg.set(chain.wrappedNative.address.toLowerCase(), {
    chainId: chain.chainId,
    address: chain.wrappedNative.address,
    symbol: chain.wrappedNative.symbol,
    name: chain.wrappedNative.name,
    decimals: chain.wrappedNative.decimals,
    isWrappedNative: true,
  })
  for (const t of chain.seededTokens ?? []) {
    reg.set(t.address.toLowerCase(), {
      chainId: chain.chainId,
      address: t.address,
      symbol: t.symbol,
      name: t.name,
      decimals: t.decimals,
      isWrappedNative: false,
    })
  }
  return reg
}

/** Resolve token metadata: static registry first (verified), else a live on-chain ERC-20 read. */
export async function getTokenMeta(chainId: number, address: string): Promise<TokenMeta> {
  const chain = getChain(chainId)
  if (!chain) {
    throw new Error(`unsupported chainId ${chainId}`)
  }
  const known = staticRegistry(chain).get(address.toLowerCase())
  if (known) {
    return known
  }
  const c = new ethers.Contract(address, ERC20_ABI, getProvider(chainId))
  const [symbol, name, decimals] = await Promise.all([
    c.symbol().catch(() => ''),
    c.name().catch(() => ''),
    c.decimals().then((d: number) => Number(d)).catch(() => 18),
  ])
  return { chainId, address, symbol, name, decimals, isWrappedNative: false }
}

/**
 * Live ERC-20 `balanceOf(owner)` for one token on a chain — the raw on-chain balance (BigNumber, in the
 * token's base units). Throws on RPC/contract error so callers can decide how to degrade (the portfolio
 * handler catches per-token and skips, never fabricating a balance).
 */
export async function getErc20Balance(chainId: number, token: string, owner: string): Promise<BigNumber> {
  const c = new ethers.Contract(token, ERC20_ABI, getProvider(chainId))
  return (await c.balanceOf(owner)) as BigNumber
}

/** Live native-coin balance (`eth_getBalance`) for an address on a chain — raw wei (BigNumber). */
export async function getNativeBalance(chainId: number, owner: string): Promise<BigNumber> {
  return getProvider(chainId).getBalance(owner)
}

/**
 * Live ERC-20 `totalSupply()` for one token on a chain — the raw on-chain supply (BigNumber, base units).
 * Used for v2 LP positions: the pair contract is itself an ERC-20 whose totalSupply is the pool's total LP
 * tokens, needed to compute an owner's proportional underlying-reserve share. Throws on RPC/contract error
 * so callers can degrade (the positions handler catches per-pair and skips, never fabricating a supply).
 */
export async function getErc20TotalSupply(chainId: number, token: string): Promise<BigNumber> {
  const c = new ethers.Contract(token, ERC20_ABI, getProvider(chainId))
  return (await c.totalSupply()) as BigNumber
}

/** CREATE2 v2 pair address for (tokenA, tokenB) under the given factory. Order-independent. */
export function computePairAddress(factory: string, tokenA: string, tokenB: string): string {
  const [token0, token1] =
    tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA]
  const salt = ethers.utils.keccak256(
    ethers.utils.solidityPack(['address', 'address'], [token0, token1]),
  )
  return ethers.utils.getCreate2Address(factory, salt, V2_PAIR_INIT_CODE_HASH)
}

export interface V2PairData {
  chainId: number
  /** pair contract address (on-chain, canonical CREATE2). Used as the proto Pool.pool_id. */
  pairAddress: string
  token0: TokenMeta
  token1: TokenMeta
  /** raw reserves aligned to token0 / token1. */
  reserve0: BigNumber
  reserve1: BigNumber
}

/** Upper bound on factory pairs enumerated per chain (guards against an unbounded allPairs loop). */
const MAX_ENUMERATED_PAIRS = 1000

/**
 * Enumerate ALL v2 pairs from a chain's factory (allPairsLength + allPairs(i)). This is the
 * authoritative on-chain list of every pair the factory created — it surfaces pools whose tokens
 * are NOT in our static `seededTokens` set. Bounded by `max`. Returns lowercased addresses. On any
 * RPC/contract error returns [] (caller still has the seeded-combo candidates), never throws.
 */
export async function enumerateV2Pairs(chainId: number, max = MAX_ENUMERATED_PAIRS): Promise<string[]> {
  const chain = getChain(chainId)
  if (!chain) {
    throw new Error(`unsupported chainId ${chainId}`)
  }
  try {
    const factory = new ethers.Contract(chain.v2Factory, V2_FACTORY_ABI, getProvider(chainId))
    const len: BigNumber = await factory.allPairsLength()
    const n = Math.min(len.toNumber(), max)
    const addrs = await Promise.all(
      Array.from({ length: n }, (_, i) => factory.allPairs(i) as Promise<string>),
    )
    return addrs.map((a) => a.toLowerCase())
  } catch {
    return []
  }
}

/** Seeded-set CREATE2 candidate pair addresses (lowercased) for a chain's curated token combos. */
function seededComboCandidates(chain: ChainConfig): string[] {
  const tokens = [chain.wrappedNative.address, ...(chain.seededTokens ?? []).map((t) => t.address)]
  const out: string[] = []
  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {
      out.push(computePairAddress(chain.v2Factory, tokens[i], tokens[j]).toLowerCase())
    }
  }
  return out
}

/**
 * Discover live v2 pools for a chain. Candidate pair addresses come from the union of (1) factory
 * enumeration (authoritative on-chain list) and (2) seeded-set CREATE2 combos, deduped. Each candidate
 * is verified with a live getCode / getReserves / token0 / token1; pools with no code or zero reserves
 * are skipped. Returns only REAL, on-chain-verified pools with live reserves.
 */
export async function getV2Pairs(chainId: number): Promise<V2PairData[]> {
  const chain = getChain(chainId)
  if (!chain) {
    throw new Error(`unsupported chainId ${chainId}`)
  }
  const provider = getProvider(chainId)

  const [enumerated, seeded] = await Promise.all([
    enumerateV2Pairs(chainId),
    Promise.resolve(seededComboCandidates(chain)),
  ])
  const candidates = Array.from(new Set<string>([...enumerated, ...seeded]))

  const results: V2PairData[] = []
  await Promise.all(
    candidates.map(async (pairAddress) => {
      try {
        // No contract deployed at the address => pool doesn't exist (seeded combo never created).
        const code = await provider.getCode(pairAddress)
        if (!code || code === '0x') {
          return
        }
        const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider)
        const [reserves, token0Addr, token1Addr] = await Promise.all([
          pair.getReserves(),
          pair.token0(),
          pair.token1(),
        ])
        const reserve0: BigNumber = reserves.reserve0
        const reserve1: BigNumber = reserves.reserve1
        // Empty pool: no liquidity, nothing to display/route. Skip honestly.
        if (reserve0.isZero() && reserve1.isZero()) {
          return
        }
        const [token0, token1] = await Promise.all([
          getTokenMeta(chainId, token0Addr),
          getTokenMeta(chainId, token1Addr),
        ])
        results.push({ chainId, pairAddress: ethers.utils.getAddress(pairAddress), token0, token1, reserve0, reserve1 })
      } catch {
        // RPC hiccup or non-conforming contract at that address — skip this pool, never fabricate.
        return
      }
    }),
  )
  return results
}

// ---------- v3 pool discovery (PoolCreated event scan) ----------

export interface V3PoolData {
  chainId: number
  /** v3 pool contract address (used as the proto Pool.pool_id). */
  poolAddress: string
  token0: TokenMeta
  token1: TokenMeta
  /** v3 fee, in hundredths of a bip (pips) — the same unit the proto feeTier expects (e.g. 3000 = 0.30%). */
  fee: number
  /** live ERC-20 balance of the pool contract, aligned to token0 / token1 (real on-chain liquidity). */
  balance0: BigNumber
  balance1: BigNumber
}

/** Block-range window per `eth_getLogs` call — public RPCs commonly cap ranges; 9_500 is broadly safe. */
const V3_LOG_CHUNK = 9_500
/** Hard cap on getLogs chunks per discovery call, so a large fromBlock..latest span can't run unbounded. */
const V3_MAX_CHUNKS = 40

/**
 * Resolve the block to start the v3 `PoolCreated` scan from. UniswapV3Factory has no on-chain pool
 * enumerator, so discovery is a log scan — and a full-history scan on every request would hammer the
 * public RPC. We therefore REQUIRE an explicit start block (the factory deploy block), from either
 * env `V3_SCAN_FROM_BLOCK_<chainId>` or `chain.v3DeployBlock`. When neither is set we return
 * `undefined` and getV3Pools honestly returns [] rather than doing an unbounded scan. No v3 liquidity
 * is seeded on any chain yet (all seed scripts are v2, verified 2026-07-10), so [] is the correct
 * current answer; this lights up the moment a deploy block is configured after v3 pools are seeded.
 */
function resolveV3FromBlock(chain: ChainConfig): number | undefined {
  const env = process.env[`V3_SCAN_FROM_BLOCK_${chain.chainId}`]
  if (env && /^\d+$/.test(env.trim())) {
    return Number(env.trim())
  }
  if (typeof chain.v3DeployBlock === 'number') {
    return chain.v3DeployBlock
  }
  return undefined
}

/** Scan the v3 factory's PoolCreated logs from `fromBlock` to latest, chunked + bounded. Never throws. */
async function scanV3PoolCreated(
  chainId: number,
  factory: string,
  fromBlock: number,
): Promise<Array<{ pool: string; token0: string; token1: string; fee: number }>> {
  const provider = getProvider(chainId)
  const found: Array<{ pool: string; token0: string; token1: string; fee: number }> = []
  const topic = v3FactoryIface.getEventTopic('PoolCreated')
  let latest: number
  try {
    latest = await provider.getBlockNumber()
  } catch {
    return found
  }
  let start = fromBlock
  let chunks = 0
  while (start <= latest && chunks < V3_MAX_CHUNKS) {
    const end = Math.min(start + V3_LOG_CHUNK - 1, latest)
    try {
      const logs = await provider.getLogs({ address: factory, topics: [topic], fromBlock: start, toBlock: end })
      for (const log of logs) {
        try {
          const parsed = v3FactoryIface.parseLog(log)
          found.push({
            pool: parsed.args.pool as string,
            token0: parsed.args.token0 as string,
            token1: parsed.args.token1 as string,
            fee: (parsed.args.fee as BigNumber).toNumber(),
          })
        } catch {
          // Non-conforming log at this address — skip it, never fabricate a pool.
        }
      }
    } catch {
      // RPC rejected this range (or a transient error) — skip the window, keep scanning the rest.
    }
    start = end + 1
    chunks += 1
  }
  if (start <= latest) {
    // Bounded out before reaching `latest`: honest partial. Log it (no silent truncation) — callers
    // still get every pool found in the scanned window; a full backfill is the Phase-2 indexer's job.
    // eslint-disable-next-line no-console
    console.warn(`[data-api] v3 scan chain ${chainId} stopped at block ${start - 1}/${latest} (chunk cap ${V3_MAX_CHUNKS}); increase V3_SCAN_FROM_BLOCK or add an indexer for full history`)
  }
  return found
}

/**
 * Discover live v3 pools for a chain via a `PoolCreated` log scan (gated on a configured start block —
 * see resolveV3FromBlock). Each pool is verified with live ERC-20 `balanceOf(pool)` on both tokens;
 * pools holding zero of both are skipped (no liquidity, nothing to show/route). Token metadata is read
 * live on-chain. Returns only REAL, on-chain-verified pools. Returns [] when no start block is
 * configured or on any error — never throws, never fabricates.
 */
export async function getV3Pools(chainId: number): Promise<V3PoolData[]> {
  const chain = getChain(chainId)
  if (!chain) {
    throw new Error(`unsupported chainId ${chainId}`)
  }
  if (!chain.v3Factory || /^0x0+$/.test(chain.v3Factory)) {
    return []
  }
  const fromBlock = resolveV3FromBlock(chain)
  if (fromBlock === undefined) {
    return []
  }
  const provider = getProvider(chainId)
  const created = await scanV3PoolCreated(chainId, chain.v3Factory, fromBlock)
  // A (token0,token1,fee) triple maps to exactly one pool address; dedupe by address defensively.
  const byAddr = new Map<string, { pool: string; token0: string; token1: string; fee: number }>()
  for (const c of created) {
    byAddr.set(c.pool.toLowerCase(), c)
  }

  const results: V3PoolData[] = []
  await Promise.all(
    Array.from(byAddr.values()).map(async (c) => {
      try {
        const t0 = new ethers.Contract(c.token0, ERC20_ABI, provider)
        const t1 = new ethers.Contract(c.token1, ERC20_ABI, provider)
        const [balance0, balance1] = await Promise.all([
          t0.balanceOf(c.pool) as Promise<BigNumber>,
          t1.balanceOf(c.pool) as Promise<BigNumber>,
        ])
        // Empty pool (no tokens deposited) — skip honestly, same policy as the v2 zero-reserve skip.
        if (balance0.isZero() && balance1.isZero()) {
          return
        }
        const [token0, token1] = await Promise.all([
          getTokenMeta(chainId, c.token0),
          getTokenMeta(chainId, c.token1),
        ])
        results.push({
          chainId,
          poolAddress: ethers.utils.getAddress(c.pool),
          token0,
          token1,
          fee: c.fee,
          balance0,
          balance1,
        })
      } catch {
        // RPC hiccup / non-ERC20 token — skip this pool, never fabricate.
      }
    }),
  )
  return results
}

/**
 * Spot price of a token DENOMINATED IN THE WRAPPED-NATIVE, derived from a pool's live reserves.
 * price(token) = reserve(wrappedNative) / reserve(token), both normalized by decimals.
 *
 * There is NO USD oracle on these chains, so we return the native-denominated ratio ONLY (and
 * `usd: undefined`). Callers must NOT put this ratio into a USD-semantic proto field — see handlers.ts.
 */
export interface SpotPrice {
  tokenAddress: string
  /** price of 1 token expressed in units of the wrapped-native, from live reserves. */
  priceInNative: number
  /** always undefined in Phase 1 — no USD reference exists on these chains. Kept explicit, never faked. */
  usd: undefined
}

export async function getSpotPrices(chainId: number): Promise<SpotPrice[]> {
  const chain = getChain(chainId)
  if (!chain) {
    throw new Error(`unsupported chainId ${chainId}`)
  }
  const wnative = chain.wrappedNative.address.toLowerCase()
  const pairs = await getV2Pairs(chainId)
  const prices: SpotPrice[] = []
  for (const p of pairs) {
    const t0IsNative = p.token0.address.toLowerCase() === wnative
    const t1IsNative = p.token1.address.toLowerCase() === wnative
    if (!t0IsNative && !t1IsNative) {
      // Neither side is the wrapped-native — can't express in native terms from this pool alone. Skip.
      continue
    }
    const nativeTok = t0IsNative ? p.token0 : p.token1
    const otherTok = t0IsNative ? p.token1 : p.token0
    const nativeReserve = t0IsNative ? p.reserve0 : p.reserve1
    const otherReserve = t0IsNative ? p.reserve1 : p.reserve0
    const nativeHuman = Number(ethers.utils.formatUnits(nativeReserve, nativeTok.decimals))
    const otherHuman = Number(ethers.utils.formatUnits(otherReserve, otherTok.decimals))
    if (otherHuman === 0) {
      continue
    }
    prices.push({ tokenAddress: otherTok.address, priceInNative: nativeHuman / otherHuman, usd: undefined })
  }
  return prices
}
