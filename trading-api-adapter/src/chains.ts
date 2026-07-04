/**
 * Per-chain config for the HookSwap Trading API adapter.
 *
 * Addresses are copied from HookSwap/contracts/deployments/<chain>.json (the real,
 * on-chain HookSwap-owned v2+v3+UR stack). These are used for:
 *   - swappable_tokens (wrapped-native metadata is real, static, safe to serve)
 *   - documentation / sanity checks
 *   - the direct-SOR-embed mode (TODO in routingClient.ts) which needs factory/quoter/router
 *
 * RPC URLs are read from env (see config/rpc.example.env). Public endpoints are the
 * defaults; Reggie replaces with hosted (Alchemy/QuickNode/etc) URLs + keys.
 */

export interface ChainConfig {
  chainId: number
  name: string
  /** env var this adapter reads for the RPC URL (falls back to `publicRpc`). */
  rpcEnvVar: string
  /** public fallback RPC (works but rate-limited; replace with hosted). */
  publicRpc: string
  nativeSymbol: string
  nativeDecimals: number
  /** wrapped-native token (WETH9-compatible). Real, static metadata. */
  wrappedNative: {
    address: string
    symbol: string
    name: string
    decimals: number
  }
  // deployed HookSwap stack (from contracts/deployments/*.json)
  v2Factory: string
  v2Router02: string
  v3Factory: string
  v3QuoterV2?: string // undefined where not yet deployed (HyperEVM/Tempo quoter pending)
  swapRouter02: string
  universalRouter: string
  multicall2: string
  permit2: string
  /** protocols to request from routing-api for this chain. v2+v3 only (no v4). */
  protocols: Array<'v2' | 'v3'>
  /** contracts fully live? HyperEVM v3 quoter still pending per deployments/hyperevm.json. */
  ready: boolean
}

const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3'

export const CHAINS: Record<number, ChainConfig> = {
  // ---- MegaETH (4326) — DEPLOYED ----
  4326: {
    chainId: 4326,
    name: 'megaeth',
    rpcEnvVar: 'WEB3_RPC_4326',
    publicRpc: 'https://mainnet.megaeth.com/rpc',
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    wrappedNative: { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    v2Factory: '0xD1Cf664944173140AFc302c169eFD55c24966B45',
    v2Router02: '0xBe3729d06E3A17F3c7c5ac394c7bCbe138B6EEFA',
    v3Factory: '0xAa1f5Bd529Be345e7FB77934554112E5ecd7D7f3',
    v3QuoterV2: '0x15cD41B273865feD20BC8B5cDF4423D7678ac78E',
    swapRouter02: '0xE8526A0429aeC9a5253ac854F8b6dC964E677EE4',
    universalRouter: '0x3D30133F4d4A80684F02d8310faF572E3dc193b3',
    multicall2: '0xfEb3eA6212761c1891389e77ee5Bf27c3b385E1A',
    permit2: PERMIT2,
    protocols: ['v2', 'v3'],
    ready: true,
  },

  // ---- Robinhood (4663) — DEPLOYED ----
  4663: {
    chainId: 4663,
    name: 'robinhood',
    rpcEnvVar: 'WEB3_RPC_4663',
    publicRpc: 'https://rpc.mainnet.chain.robinhood.com',
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    wrappedNative: { address: '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    v2Factory: '0xD1Cf664944173140AFc302c169eFD55c24966B45',
    v2Router02: '0xBe3729d06E3A17F3c7c5ac394c7bCbe138B6EEFA',
    v3Factory: '0xAa1f5Bd529Be345e7FB77934554112E5ecd7D7f3',
    v3QuoterV2: '0x15cD41B273865feD20BC8B5cDF4423D7678ac78E',
    swapRouter02: '0xE8526A0429aeC9a5253ac854F8b6dC964E677EE4',
    universalRouter: '0x3D30133F4d4A80684F02d8310faF572E3dc193b3',
    multicall2: '0xfEb3eA6212761c1891389e77ee5Bf27c3b385E1A',
    permit2: PERMIT2,
    protocols: ['v2', 'v3'],
    ready: true,
  },

  // ---- Ink (57073) — DEPLOYED ----
  57073: {
    chainId: 57073,
    name: 'ink',
    rpcEnvVar: 'WEB3_RPC_57073',
    publicRpc: 'https://rpc-gel.inkonchain.com',
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    wrappedNative: { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    v2Factory: '0xD1Cf664944173140AFc302c169eFD55c24966B45',
    v2Router02: '0xBe3729d06E3A17F3c7c5ac394c7bCbe138B6EEFA',
    v3Factory: '0xAa1f5Bd529Be345e7FB77934554112E5ecd7D7f3',
    v3QuoterV2: '0x15cD41B273865feD20BC8B5cDF4423D7678ac78E',
    swapRouter02: '0xE8526A0429aeC9a5253ac854F8b6dC964E677EE4',
    universalRouter: '0x3D30133F4d4A80684F02d8310faF572E3dc193b3',
    multicall2: '0xfEb3eA6212761c1891389e77ee5Bf27c3b385E1A',
    permit2: PERMIT2,
    protocols: ['v2', 'v3'],
    ready: true,
  },

  // ---- XLayer (196) — DEPLOYED ----
  196: {
    chainId: 196,
    name: 'xlayer',
    rpcEnvVar: 'WEB3_RPC_196',
    publicRpc: 'https://xlayer.drpc.org',
    nativeSymbol: 'OKB',
    nativeDecimals: 18,
    wrappedNative: { address: '0xe538905cf8410324e03A5A23C1c177a474D59b2b', symbol: 'WOKB', name: 'Wrapped OKB', decimals: 18 },
    v2Factory: '0xD1Cf664944173140AFc302c169eFD55c24966B45',
    v2Router02: '0xAa1f5Bd529Be345e7FB77934554112E5ecd7D7f3',
    v3Factory: '0xAB34Bb3767020059A35e71D03f13E9e4fbCD07aC',
    v3QuoterV2: '0xE8526A0429aeC9a5253ac854F8b6dC964E677EE4',
    swapRouter02: '0x3D30133F4d4A80684F02d8310faF572E3dc193b3',
    universalRouter: '0x6d8a0783213B3b06648DB3708a89732af3661005',
    multicall2: '0xA24cD888adAF42011a49d8Eaedb2Fe751C54e7E2',
    permit2: PERMIT2,
    protocols: ['v2', 'v3'],
    ready: true,
  },

  // ---- HyperEVM (999) — v2+v3 core+router DEPLOYED, v3 QuoterV2 PENDING ----
  999: {
    chainId: 999,
    name: 'hyperevm',
    rpcEnvVar: 'WEB3_RPC_999',
    publicRpc: 'https://rpc.hyperliquid.xyz/evm',
    nativeSymbol: 'HYPE',
    nativeDecimals: 18,
    wrappedNative: { address: '0x5555555555555555555555555555555555555555', symbol: 'WHYPE', name: 'Wrapped HYPE', decimals: 18 },
    v2Factory: '0xB92598Fa464B96FEC394a17A269Ad18060Ec60B2',
    v2Router02: '0xbd817036c5bF69Cb27D3A342129e39f9f908577d',
    v3Factory: '0x45DB3eaE624dBcA631A9C6C1406DA0B8F6Fb275A',
    v3QuoterV2: undefined, // TODO: fill from contracts/deployments/hyperevm.json once v3 periphery deploy completes.
    swapRouter02: '0xD96fc9629AFaf325fCdd7F98Dc9b8dc2165adcBB',
    universalRouter: '0xD9d4795F2A12305a12C36455ADAD011F2D6143AB',
    multicall2: '0x15cD41B273865feD20BC8B5cDF4423D7678ac78E',
    permit2: PERMIT2,
    protocols: ['v2', 'v3'],
    ready: false, // v3 quoter pending; v2 quotes should still work.
  },

  // ---- Tempo (4217) — DEPLOYED; native gas paid in pathUSD (no native wrap in-app) ----
  4217: {
    chainId: 4217,
    name: 'tempo',
    rpcEnvVar: 'WEB3_RPC_4217',
    publicRpc: 'https://rpc.tempo.xyz',
    nativeSymbol: 'pathUSD',
    nativeDecimals: 18,
    // WETH9 param used by the router deploy; interface leaves tempo wrappedNativeCurrency=null.
    wrappedNative: { address: '0xBbBcC62853a5fA27b93d6Bab3E6F7ce841E25Df2', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    v2Factory: '0xE8526A0429aeC9a5253ac854F8b6dC964E677EE4',
    v2Router02: '0x6d8a0783213B3b06648DB3708a89732af3661005',
    v3Factory: '0xAa1f5Bd529Be345e7FB77934554112E5ecd7D7f3',
    v3QuoterV2: undefined, // TODO: fill from contracts/deployments/tempo.json.
    swapRouter02: '0x3D30133F4d4A80684F02d8310faF572E3dc193b3',
    universalRouter: '0x62aE013cb2b232C20094B466C94bb39714eF661E',
    multicall2: '0xfEb3eA6212761c1891389e77ee5Bf27c3b385E1A',
    permit2: PERMIT2,
    protocols: ['v2', 'v3'],
    ready: false, // v3 quoter pending; native-gas model differs — validate before GA.
  },

  // ---- Sepolia (11155111) — canonical Uniswap stack reused (testing) ----
  11155111: {
    chainId: 11155111,
    name: 'sepolia',
    rpcEnvVar: 'WEB3_RPC_11155111',
    publicRpc: 'https://ethereum-sepolia-rpc.publicnode.com',
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    wrappedNative: { address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
    // Canonical Uniswap Sepolia deployment (already wired in sdk-core; adapter serves via routing-api).
    v2Factory: '0xF62c03E08ada871A0bEb309762E260a7a6a880E6',
    v2Router02: '0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3',
    v3Factory: '0x0227628f3F023bb0B980b67D528571c95c6DaC1c',
    v3QuoterV2: '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3',
    swapRouter02: '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E',
    universalRouter: '0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b',
    multicall2: '0xca11bde05977b3631167028862be2a173976ca11',
    permit2: PERMIT2,
    protocols: ['v2', 'v3'],
    ready: true,
  },
}

export function getChain(chainId: number): ChainConfig | undefined {
  return CHAINS[chainId]
}

export function isSupportedChain(chainId: number): boolean {
  return chainId in CHAINS
}

/** Resolve the RPC URL for a chain: env override first, public fallback second. */
export function resolveRpcUrl(chain: ChainConfig): string {
  return process.env[chain.rpcEnvVar] || chain.publicRpc
}
