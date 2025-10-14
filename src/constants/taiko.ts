/**
 * Taiko Hoodi Testnet Configuration
 * Chain ID: 167012
 *
 * Deployment Information:
 * - Network: Taiko Hoodi Testnet
 * - RPC URL: https://rpc.hoodi.taiko.xyz
 * - Block Explorer: https://hoodi.taikoscan.io/
 * - Deployer: 0xFE5124f99f544a84C3C6D0A26339a04937cD2Ff4
 */

// Custom ChainId for Taiko Hoodi Testnet
export const TAIKO_HOODI_CHAIN_ID = 167012 as const

/**
 * Uniswap V3 Contract Addresses on Taiko Hoodi
 */
export const TAIKO_HOODI_ADDRESSES = {
  // Core Protocol
  weth9: '0x73C251a8005D31900Fe32A309C05d60adf6ba87a',
  factory: '0xF7D0a7B04eBcB07b1bB5992d6B50a5BF55C903af',

  // Periphery Contracts
  router: '0x7812fF6117c838cC025F5cfaD5ac8C300baA0c5D',
  positionManager: '0x6a794430DC233E3433E8a70d1a900923fd3cB9e3',
  quoterV2: '0xef840140Dd75eC5Fa4Aa0002aEa52a8937da2611',
  multicall: '0xA37f6e12b224A3d6AaF5C384876B919b3122B830',
  tickLens: '0xFaF7dd4dF637fdcb9Abe41e98D84b3e4a906A1D0',

  // Additional Contracts
  v3Migrator: '0xe59A68212b91FfAb07195f95c607A2A3CdAf012B',
  v3Staker: '0x01715d9e4b69D25dbf1c4047287CF3f47F070d35',

  // Governance & Admin
  proxyAdmin: '0xa3a3F71bd5a24BC65B4ba80ac14839fAAc7ae5fD',
  nftDescriptorProxy: '0x290265ACd21816EE414E64eEC77dd490d8dd9f51',
  nftDescriptorImplementation: '0x95270d42071FA60dEfdb3F8D29ebaAF1754ab225',
  nftDescriptorLibrary: '0xD80C8Cc7926D670093cd309Ae6Cff9b27b425fC5',
} as const

/**
 * Extended address mappings for SDK compatibility
 * These extend the @uniswap/sdk-core address constants with Taiko Hoodi support
 */
export const TAIKO_HOODI_V3_CORE_FACTORY_ADDRESSES = {
  [TAIKO_HOODI_CHAIN_ID]: TAIKO_HOODI_ADDRESSES.factory,
} as const

export const TAIKO_HOODI_V3_MIGRATOR_ADDRESSES = {
  [TAIKO_HOODI_CHAIN_ID]: TAIKO_HOODI_ADDRESSES.v3Migrator,
} as const

export const TAIKO_HOODI_MULTICALL_ADDRESSES = {
  [TAIKO_HOODI_CHAIN_ID]: TAIKO_HOODI_ADDRESSES.multicall,
} as const

export const TAIKO_HOODI_QUOTER_ADDRESSES = {
  [TAIKO_HOODI_CHAIN_ID]: TAIKO_HOODI_ADDRESSES.quoterV2,
} as const

export const TAIKO_HOODI_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES = {
  [TAIKO_HOODI_CHAIN_ID]: TAIKO_HOODI_ADDRESSES.positionManager,
} as const

export const TAIKO_HOODI_TICK_LENS_ADDRESSES = {
  [TAIKO_HOODI_CHAIN_ID]: TAIKO_HOODI_ADDRESSES.tickLens,
} as const

export const TAIKO_HOODI_SWAP_ROUTER_02_ADDRESSES = {
  [TAIKO_HOODI_CHAIN_ID]: TAIKO_HOODI_ADDRESSES.router,
} as const
