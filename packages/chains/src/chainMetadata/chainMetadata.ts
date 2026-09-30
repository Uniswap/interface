import { UniverseChainId } from '../rpc/types'

/**
 * Web-safe chain metadata: the identity fields of `UNIVERSE_CHAIN_INFO` without its
 * Tamagui / react-native / gating dependencies.
 *
 * This file intentionally has no transitive dependencies beyond the enum so it can be
 * safely imported from lightweight runtimes (edge workers, mycelium-only web apps).
 *
 * A drift test in `packages/uniswap` (chainMetadata.drift.test.ts) pins every entry to
 * `UNIVERSE_CHAIN_INFO`, so this is a projection of the canonical table, not a second
 * source of truth. Change chain facts there first; this table follows.
 */
export interface ChainMetadata {
  id: UniverseChainId
  /** Canonical display name, e.g. 'OP Mainnet'. Matches UNIVERSE_CHAIN_INFO[id].label. */
  label: string
  /** Canonical URL slug, e.g. 'optimism'. Source of CHAIN_ID_TO_URL_PARAM. */
  urlParam: string
  testnet: boolean
  explorer: {
    name: string
    /** Origin without trailing slash, e.g. 'https://etherscan.io'. */
    url: string
  }
}

// Typed as `Record<UniverseChainId, ChainMetadata>` so the build breaks whenever a new
// chain is added to the enum without a corresponding entry here.
export const CHAIN_METADATA: Record<UniverseChainId, ChainMetadata> = {
  [UniverseChainId.Mainnet]: {
    id: UniverseChainId.Mainnet,
    label: 'Ethereum',
    urlParam: 'ethereum',
    testnet: false,
    explorer: { name: 'Etherscan', url: 'https://etherscan.io' },
  },
  [UniverseChainId.ArbitrumOne]: {
    id: UniverseChainId.ArbitrumOne,
    label: 'Arbitrum',
    urlParam: 'arbitrum',
    testnet: false,
    explorer: { name: 'Arbiscan', url: 'https://arbiscan.io' },
  },
  [UniverseChainId.Arc]: {
    id: UniverseChainId.Arc,
    label: 'Arc',
    urlParam: 'arc',
    testnet: false,
    explorer: { name: 'Arcscan', url: 'https://explorer.arc.io' },
  },
  [UniverseChainId.Avalanche]: {
    id: UniverseChainId.Avalanche,
    label: 'Avalanche',
    urlParam: 'avalanche',
    testnet: false,
    explorer: { name: 'Snowtrace', url: 'https://snowtrace.io' },
  },
  [UniverseChainId.Base]: {
    id: UniverseChainId.Base,
    label: 'Base',
    urlParam: 'base',
    testnet: false,
    explorer: { name: 'BaseScan', url: 'https://basescan.org' },
  },
  [UniverseChainId.Blast]: {
    id: UniverseChainId.Blast,
    label: 'Blast',
    urlParam: 'blast',
    testnet: false,
    explorer: { name: 'Blastscan', url: 'https://blastscan.io' },
  },
  [UniverseChainId.Bnb]: {
    id: UniverseChainId.Bnb,
    label: 'BNB Chain',
    urlParam: 'bnb',
    testnet: false,
    explorer: { name: 'BscScan', url: 'https://bscscan.com' },
  },
  [UniverseChainId.Celo]: {
    id: UniverseChainId.Celo,
    label: 'Celo',
    urlParam: 'celo',
    testnet: false,
    explorer: { name: 'CeloScan', url: 'https://celoscan.io' },
  },
  [UniverseChainId.Ink]: {
    id: UniverseChainId.Ink,
    label: 'Ink',
    urlParam: 'ink',
    testnet: false,
    explorer: { name: 'Blockscout', url: 'https://explorer.inkonchain.com' },
  },
  [UniverseChainId.Linea]: {
    id: UniverseChainId.Linea,
    label: 'Linea',
    urlParam: 'linea',
    testnet: false,
    explorer: { name: 'Lineascan', url: 'https://lineascan.build' },
  },
  [UniverseChainId.MegaETH]: {
    id: UniverseChainId.MegaETH,
    label: 'MegaETH',
    urlParam: 'megaeth',
    testnet: false,
    explorer: { name: 'MegaETH Blockscout', url: 'https://megaeth.blockscout.com' },
  },
  [UniverseChainId.Monad]: {
    id: UniverseChainId.Monad,
    label: 'Monad',
    urlParam: 'monad',
    testnet: false,
    explorer: { name: 'MonadVision', url: 'https://monadvision.com' },
  },
  [UniverseChainId.Optimism]: {
    id: UniverseChainId.Optimism,
    label: 'OP Mainnet',
    urlParam: 'optimism',
    testnet: false,
    explorer: { name: 'OP Etherscan', url: 'https://optimistic.etherscan.io' },
  },
  [UniverseChainId.Polygon]: {
    id: UniverseChainId.Polygon,
    label: 'Polygon',
    urlParam: 'polygon',
    testnet: false,
    explorer: { name: 'PolygonScan', url: 'https://polygonscan.com' },
  },
  [UniverseChainId.Robinhood]: {
    id: UniverseChainId.Robinhood,
    label: 'Robinhood Chain',
    urlParam: 'robinhood',
    testnet: false,
    explorer: { name: 'Robinhood Explorer', url: 'https://robinhoodchain.blockscout.com' },
  },
  [UniverseChainId.Sepolia]: {
    id: UniverseChainId.Sepolia,
    label: 'Sepolia',
    urlParam: 'ethereum_sepolia',
    testnet: true,
    explorer: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
  },
  [UniverseChainId.Solana]: {
    id: UniverseChainId.Solana,
    label: 'Solana',
    urlParam: 'solana',
    testnet: false,
    explorer: { name: 'Solscan', url: 'https://solscan.io' },
  },
  [UniverseChainId.Soneium]: {
    id: UniverseChainId.Soneium,
    label: 'Soneium',
    urlParam: 'soneium',
    testnet: false,
    explorer: { name: 'Blockscout', url: 'https://soneium.blockscout.com' },
  },
  [UniverseChainId.Tempo]: {
    id: UniverseChainId.Tempo,
    label: 'Tempo',
    urlParam: 'tempo',
    testnet: false,
    explorer: { name: 'Tempo Explorer', url: 'https://explore.tempo.xyz' },
  },
  [UniverseChainId.UnichainSepolia]: {
    id: UniverseChainId.UnichainSepolia,
    label: 'Unichain Sepolia',
    urlParam: 'unichain_sepolia',
    testnet: true,
    explorer: { name: 'Uniscan Sepolia', url: 'https://sepolia.uniscan.xyz' },
  },
  [UniverseChainId.Unichain]: {
    id: UniverseChainId.Unichain,
    label: 'Unichain',
    urlParam: 'unichain',
    testnet: false,
    explorer: { name: 'Uniscan', url: 'https://uniscan.xyz' },
  },
  [UniverseChainId.WorldChain]: {
    id: UniverseChainId.WorldChain,
    label: 'World Chain',
    urlParam: 'worldchain',
    testnet: false,
    explorer: { name: 'WorldScan', url: 'https://worldscan.org' },
  },
  [UniverseChainId.XLayer]: {
    id: UniverseChainId.XLayer,
    label: 'X Layer',
    urlParam: 'xlayer',
    testnet: false,
    explorer: { name: 'X Layer Explorer', url: 'https://web3.okx.com/explorer/x-layer' },
  },
  [UniverseChainId.Zksync]: {
    id: UniverseChainId.Zksync,
    label: 'ZKsync',
    urlParam: 'zksync',
    testnet: false,
    explorer: { name: 'ZKsync Explorer', url: 'https://explorer.zksync.io' },
  },
  [UniverseChainId.Zora]: {
    id: UniverseChainId.Zora,
    label: 'Zora Network',
    urlParam: 'zora',
    testnet: false,
    explorer: { name: 'Zora Explorer', url: 'https://explorer.zora.energy' },
  },
}

export function getChainMetadata(chainId: UniverseChainId): ChainMetadata {
  return CHAIN_METADATA[chainId]
}
