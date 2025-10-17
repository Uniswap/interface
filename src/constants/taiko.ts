/**
 * Taiko Chain Configurations
 *
 * Taiko Mainnet - Chain ID: 167000
 * Taiko Hoodi Testnet - Chain ID: 167012
 *
 * Deployment Information:
 * - Mainnet RPC URL: https://rpc.mainnet.taiko.xyz
 * - Hoodi RPC URL: https://rpc.hoodi.taiko.xyz
 * - Mainnet Block Explorer: https://taikoscan.io/
 * - Hoodi Block Explorer: https://hoodi.taikoscan.io/
 * - Deployer: 0xFE5124f99f544a84C3C6D0A26339a04937cD2Ff4
 */

// Custom ChainIds for Taiko networks
export const TAIKO_MAINNET_CHAIN_ID = 167000 as const
export const TAIKO_HOODI_CHAIN_ID = 167012 as const

/**
 * Uniswap V3 Contract Addresses on Taiko Mainnet
 *
 * Research Notes (as of October 2025):
 * - Uniswap V3 deployment on Taiko Mainnet was approved by governance in 2024
 * - Position Manager (NFT) confirmed deployed at: 0x8b3c541c30f9b29560f56b9e44b59718916b69ef
 * - Other contract addresses are likely deployed but not yet publicly documented
 * - Taiko Mainnet uses standard Uniswap V3 contracts but addresses should be verified on taikoscan.io
 *
 * TODO: Verify and update these addresses with official Taiko Mainnet deployments
 * WARNING: Do not use these placeholder addresses in production without verification!
 */
export const TAIKO_MAINNET_ADDRESSES = {
  // Core Protocol
  weth9: '0x0000000000000000000000000000000000000000', // TODO: Update with actual Taiko Mainnet WETH address
  factory: '0x0000000000000000000000000000000000000000', // TODO: Verify - typically 0x1F98431c8aD98523631AE4a59f267346ea31F984

  // Periphery Contracts
  router: '0x0000000000000000000000000000000000000000', // TODO: Verify - typically 0xe592427a0AEce92De3Edee1F18E0157C05861564
  positionManager: '0x8b3c541c30f9b29560f56b9e44b59718916b69ef', // CONFIRMED on taikoscan.io
  quoterV2: '0x0000000000000000000000000000000000000000', // TODO: Verify - typically 0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6
  multicall: '0x0000000000000000000000000000000000000000', // TODO: Update with actual deployment
  tickLens: '0x0000000000000000000000000000000000000000', // TODO: Update with actual deployment

  // Additional Contracts
  v3Migrator: '0x0000000000000000000000000000000000000000', // TODO: Update with actual deployment
  v3Staker: '0x0000000000000000000000000000000000000000', // TODO: Update with actual deployment

  // Governance & Admin
  proxyAdmin: '0x0000000000000000000000000000000000000000', // TODO: Update with actual deployment
  nftDescriptorProxy: '0x0000000000000000000000000000000000000000', // TODO: Update with actual deployment
  nftDescriptorImplementation: '0x0000000000000000000000000000000000000000', // TODO: Update with actual deployment
  nftDescriptorLibrary: '0x0000000000000000000000000000000000000000', // TODO: Update with actual deployment
} as const

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
 * These extend the @uniswap/sdk-core address constants with Taiko support
 */
export const TAIKO_V3_CORE_FACTORY_ADDRESSES = {
  [TAIKO_MAINNET_CHAIN_ID]: TAIKO_MAINNET_ADDRESSES.factory,
  [TAIKO_HOODI_CHAIN_ID]: TAIKO_HOODI_ADDRESSES.factory,
} as const

export const TAIKO_V3_MIGRATOR_ADDRESSES = {
  [TAIKO_MAINNET_CHAIN_ID]: TAIKO_MAINNET_ADDRESSES.v3Migrator,
  [TAIKO_HOODI_CHAIN_ID]: TAIKO_HOODI_ADDRESSES.v3Migrator,
} as const

export const TAIKO_MULTICALL_ADDRESSES = {
  [TAIKO_MAINNET_CHAIN_ID]: TAIKO_MAINNET_ADDRESSES.multicall,
  [TAIKO_HOODI_CHAIN_ID]: TAIKO_HOODI_ADDRESSES.multicall,
} as const

export const TAIKO_QUOTER_ADDRESSES = {
  [TAIKO_MAINNET_CHAIN_ID]: TAIKO_MAINNET_ADDRESSES.quoterV2,
  [TAIKO_HOODI_CHAIN_ID]: TAIKO_HOODI_ADDRESSES.quoterV2,
} as const

export const TAIKO_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES = {
  [TAIKO_MAINNET_CHAIN_ID]: TAIKO_MAINNET_ADDRESSES.positionManager,
  [TAIKO_HOODI_CHAIN_ID]: TAIKO_HOODI_ADDRESSES.positionManager,
} as const

export const TAIKO_TICK_LENS_ADDRESSES = {
  [TAIKO_MAINNET_CHAIN_ID]: TAIKO_MAINNET_ADDRESSES.tickLens,
  [TAIKO_HOODI_CHAIN_ID]: TAIKO_HOODI_ADDRESSES.tickLens,
} as const

export const TAIKO_SWAP_ROUTER_02_ADDRESSES = {
  [TAIKO_MAINNET_CHAIN_ID]: TAIKO_MAINNET_ADDRESSES.router,
  [TAIKO_HOODI_CHAIN_ID]: TAIKO_HOODI_ADDRESSES.router,
} as const

export const TAIKO_UNIVERSAL_ROUTER_ADDRESS = {
  [TAIKO_MAINNET_CHAIN_ID]: '0x0000000000000000000000000000000000000000', // TODO: Update with actual Taiko Mainnet Universal Router address
  [TAIKO_HOODI_CHAIN_ID]: '0x7812fF6117c838cC025F5cfaD5ac8C300baA0c5D', // Universal Router deployed on Taiko Hoodi
} as const

/**
 * Get Universal Router address for a given chain ID, with support for Taiko chains
 * @param chainId - The chain ID to get the Universal Router address for
 * @returns The Universal Router address for the given chain, or undefined if not supported
 */
export function getUniversalRouterAddress(chainId: number): string | undefined {
  // Check if it's a Taiko chain
  if (chainId === TAIKO_MAINNET_CHAIN_ID || chainId === TAIKO_HOODI_CHAIN_ID) {
    return TAIKO_UNIVERSAL_ROUTER_ADDRESS[chainId as keyof typeof TAIKO_UNIVERSAL_ROUTER_ADDRESS]
  }

  // For non-Taiko chains, return undefined and let the caller handle SDK lookup
  return undefined
}

// Legacy exports for backward compatibility
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
