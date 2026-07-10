/**
 * On-chain readers for the HookSwap data-api (Phase 1: current-state only).
 *
 * Everything here is a LIVE read from the chain's public/hosted RPC via ethers v5 — no cache DB,
 * no historical data, no fabricated values. Pools are discovered by CREATE2-computing the v2 pair
 * address for each {wrapped-native, seeded-token} combination (canonical v2 init-code hash +
 * the chain's HookSwap v2 factory), then reading the live `getReserves()` / `token0()` / `token1()`.
 *
 * Why CREATE2 discovery instead of factory.allPairsLength() enumeration: it's O(known-tokens),
 * needs no event scan, and returns the exact pool the interface will route through. A full
 * `allPairs(i)` enumeration is added as a fallback (`enumerateV2Pairs`) but is NOT used by default
 * because on new chains the pair count is tiny and the seeded set is authoritative.
 */

import { BigNumber, ethers } from 'ethers'
import { ChainConfig, getChain, resolveRpcUrl, V2_PAIR_INIT_CODE_HASH } from './chains'

const ERC20_ABI = [
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function decimals() view returns (uint8)',
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
  /** pair contract address (canonical CREATE2). Used as the proto Pool.pool_id. */
  pairAddress: string
  token0: TokenMeta
  token1: TokenMeta
  /** raw reserves aligned to token0 / token1. */
  reserve0: BigNumber
  reserve1: BigNumber
}

/**
 * Discover live v2 pools for a chain by CREATE2-computing the pair for every unordered
 * {wrapped-native, seeded-token} combination and reading its on-chain reserves. Pools with no
 * deployed code, or with zero reserves, are skipped (nothing to show / route). Returns only REAL,
 * on-chain-verified pools.
 */
export async function getV2Pairs(chainId: number): Promise<V2PairData[]> {
  const chain = getChain(chainId)
  if (!chain) {
    throw new Error(`unsupported chainId ${chainId}`)
  }
  const provider = getProvider(chainId)

  // Candidate token set: wrapped-native + every seeded token. Every unordered pair is a candidate pool.
  const tokens = [chain.wrappedNative.address, ...(chain.seededTokens ?? []).map((t) => t.address)]
  const combos: Array<[string, string]> = []
  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {
      combos.push([tokens[i], tokens[j]])
    }
  }

  const results: V2PairData[] = []
  await Promise.all(
    combos.map(async ([a, b]) => {
      const pairAddress = computePairAddress(chain.v2Factory, a, b)
      try {
        // No contract deployed at the CREATE2 address => pool doesn't exist yet.
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
        results.push({ chainId, pairAddress, token0, token1, reserve0, reserve1 })
      } catch {
        // RPC hiccup or non-conforming contract at that address — skip this pool, never fabricate.
        return
      }
    }),
  )
  return results
}

/**
 * Fallback: enumerate ALL v2 pairs from the factory (allPairsLength + allPairs(i)). Not used by the
 * default handlers (seeded-set CREATE2 discovery is sufficient + cheaper on these new chains), but
 * available when a chain accumulates pairs beyond the seeded set. Bounded by `max`.
 */
export async function enumerateV2Pairs(chainId: number, max = 100): Promise<string[]> {
  const chain = getChain(chainId)
  if (!chain) {
    throw new Error(`unsupported chainId ${chainId}`)
  }
  const factory = new ethers.Contract(chain.v2Factory, V2_FACTORY_ABI, getProvider(chainId))
  const len: BigNumber = await factory.allPairsLength()
  const n = Math.min(len.toNumber(), max)
  const addrs = await Promise.all(
    Array.from({ length: n }, (_, i) => factory.allPairs(i) as Promise<string>),
  )
  return addrs
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
