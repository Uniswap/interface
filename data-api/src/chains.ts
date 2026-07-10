/**
 * Per-chain config for the HookSwap data-api.
 *
 * COPIED from trading-api-adapter/src/chains.ts (single source of truth for the deployed
 * HookSwap-owned v2+v3 stack, from HookSwap/contracts/deployments/<chain>.json). The data-api
 * only needs a subset of those fields: chainId, RPC, wrapped-native metadata, the v2/v3 factory
 * addresses (for on-chain pool discovery), and the `seededTokens` list (real, verified tokens
 * beyond the wrapped-native). Router/quoter/permit2 addresses are NOT needed for read-only data.
 *
 * ROBINHOOD (4663) is the priority chain (its seeded WETH/tHOOK v2 pool is the Phase-1 target).
 * The other chains are included for parity but secondary.
 *
 * RPC URLs are read from env (WEB3_RPC_<chainId>) with the public endpoint as fallback —
 * same `resolveRpcUrl` helper as the adapter.
 */

export interface ChainConfig {
  chainId: number
  name: string
  /** env var this service reads for the RPC URL (falls back to `publicRpc`). */
  rpcEnvVar: string
  /** public fallback RPC (works but rate-limited; replace with hosted via env). */
  publicRpc: string
  nativeSymbol: string
  nativeDecimals: number
  /** wrapped-native token (WETH9-compatible). Real, static, verified metadata. */
  wrappedNative: {
    address: string
    symbol: string
    name: string
    decimals: number
  }
  /** deployed HookSwap v2 factory (from contracts/deployments/*.json). Used for CREATE2 pair discovery. */
  v2Factory: string
  /** deployed HookSwap v3 factory. Used for v3 `PoolCreated` log-scan discovery (see onchain.ts). */
  v3Factory: string
  /**
   * Block the v3 factory was deployed at — the start block for the `PoolCreated` log scan. Optional:
   * UniswapV3Factory has no pool enumerator, so v3 discovery requires a start block (this, or env
   * `V3_SCAN_FROM_BLOCK_<chainId>`) to avoid an unbounded full-history scan on every request. Omit
   * until v3 pools are actually seeded on a chain — while unset, v3 discovery honestly returns [].
   */
  v3DeployBlock?: number
  /**
   * Known-real tokens beyond the wrapped-native (e.g. a chain's seeded test token).
   * Real, static, verified metadata only — we do NOT invent tokens. Optional; omit until a
   * chain has one. On-chain pool discovery pairs each of these with the wrapped-native.
   */
  seededTokens?: Array<{ address: string; symbol: string; name: string; decimals: number }>
}

export const CHAINS: Record<number, ChainConfig> = {
  // ---- Robinhood (4663) — PRIORITY. Seeded WETH/tHOOK v2 pool. ----
  4663: {
    chainId: 4663,
    name: 'robinhood',
    rpcEnvVar: 'WEB3_RPC_4663',
    publicRpc: 'https://rpc.mainnet.chain.robinhood.com',
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    wrappedNative: { address: '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    v2Factory: '0xD1Cf664944173140AFc302c169eFD55c24966B45',
    v3Factory: '0xAa1f5Bd529Be345e7FB77934554112E5ecd7D7f3',
    // Seeded WETH/tHOOK v2 pool (contracts/seed/broadcast/SeedPools.s.sol/4663/run-latest.json).
    seededTokens: [{ address: '0x3b5a01Efc59f3465b8Eb04697f97CFE0BA700D9D', symbol: 'tHOOK', name: 'Test Hook Token', decimals: 18 }],
  },

  // ---- MegaETH (4326) ----
  4326: {
    chainId: 4326,
    name: 'megaeth',
    rpcEnvVar: 'WEB3_RPC_4326',
    publicRpc: 'https://mainnet.megaeth.com/rpc',
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    wrappedNative: { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    v2Factory: '0xD1Cf664944173140AFc302c169eFD55c24966B45',
    v3Factory: '0xAa1f5Bd529Be345e7FB77934554112E5ecd7D7f3',
  },

  // ---- Ink (57073) ----
  57073: {
    chainId: 57073,
    name: 'ink',
    rpcEnvVar: 'WEB3_RPC_57073',
    publicRpc: 'https://rpc-gel.inkonchain.com',
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    wrappedNative: { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    v2Factory: '0xD1Cf664944173140AFc302c169eFD55c24966B45',
    v3Factory: '0xAa1f5Bd529Be345e7FB77934554112E5ecd7D7f3',
  },

  // ---- XLayer (196) — has a seeded WOKB/SeedTestToken v2 pool (per CLAUDE.md 2026-07-08). ----
  196: {
    chainId: 196,
    name: 'xlayer',
    rpcEnvVar: 'WEB3_RPC_196',
    publicRpc: 'https://xlayer.drpc.org',
    nativeSymbol: 'OKB',
    nativeDecimals: 18,
    wrappedNative: { address: '0xe538905cf8410324e03A5A23C1c177a474D59b2b', symbol: 'WOKB', name: 'Wrapped OKB', decimals: 18 },
    v2Factory: '0xD1Cf664944173140AFc302c169eFD55c24966B45',
    v3Factory: '0xAB34Bb3767020059A35e71D03f13E9e4fbCD07aC',
    // NOTE: XLayer has TWO real on-chain v2 pools under this factory (verified via live allPairs()
    // on 2026-07-10): pair[0] 0x782acfD69d0BeE76aC4B618D2f5fDD9060F5854E (HKT 0x0E88A920A522d2e858B5fB0e896F228f4619E0a6 / WOKB)
    // and the seeded pair[1] 0x1A95898916C7872F4712c92A1b665E54414728Bd (HKT 0x144331BB4C3026D135896CaFec3Ae3D667f4F376 / WOKB,
    // matching CLAUDE.md 2026-07-08). Both are now discovered automatically by onchain.ts factory
    // ENUMERATION (allPairsLength/allPairs) with live-read ERC-20 metadata — no hardcoded seededTokens
    // needed. Left empty deliberately: enumeration is authoritative and avoids duplicating the two
    // same-symbol ("HKT") tokens with guessed names here.
  },

  // ---- HyperEVM (999) ----
  999: {
    chainId: 999,
    name: 'hyperevm',
    rpcEnvVar: 'WEB3_RPC_999',
    publicRpc: 'https://rpc.hyperliquid.xyz/evm',
    nativeSymbol: 'HYPE',
    nativeDecimals: 18,
    wrappedNative: { address: '0x5555555555555555555555555555555555555555', symbol: 'WHYPE', name: 'Wrapped HYPE', decimals: 18 },
    v2Factory: '0xB92598Fa464B96FEC394a17A269Ad18060Ec60B2',
    v3Factory: '0x45DB3eaE624dBcA631A9C6C1406DA0B8F6Fb275A',
  },

  // ---- Sepolia (11155111) — canonical Uniswap stack (testing). ----
  11155111: {
    chainId: 11155111,
    name: 'sepolia',
    rpcEnvVar: 'WEB3_RPC_11155111',
    publicRpc: 'https://ethereum-sepolia-rpc.publicnode.com',
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    wrappedNative: { address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    v2Factory: '0xF62c03E08ada871A0bEb309762E260a7a6a880E6',
    v3Factory: '0x0227628f3F023bb0B980b67D528571c95c6DaC1c',
  },
}

/**
 * v2 pair init-code hash — CANONICAL Uniswap v2 (verified == HookSwap's deployed v2 factory in
 * CLAUDE.md 2026-07-03 & confirmed on XLayer 2026-07-08, computed pair == on-chain pair).
 * Used with the per-chain v2Factory for CREATE2 pair-address computation in onchain.ts.
 */
export const V2_PAIR_INIT_CODE_HASH = '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f'

export function getChain(chainId: number): ChainConfig | undefined {
  return CHAINS[chainId]
}

export function isSupportedChain(chainId: number): boolean {
  return chainId in CHAINS
}

export function supportedChainIds(): number[] {
  return Object.keys(CHAINS).map(Number)
}

/** Resolve the RPC URL for a chain: env override first, public fallback second. */
export function resolveRpcUrl(chain: ChainConfig): string {
  return process.env[chain.rpcEnvVar] || chain.publicRpc
}
