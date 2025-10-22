import { ARBITRUM_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/arbitrum'
import { AVALANCHE_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/avalanche'
import { BASE_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/base'
import { BLAST_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/blast'
import { BNB_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/bnb'
import { CELO_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/celo'
import { MAINNET_CHAIN_INFO, SEPOLIA_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/mainnet'
import { MONAD_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/monad'
import { OPTIMISM_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/optimism'
import { POLYGON_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/polygon'
import { SONEIUM_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/soneium'
import { UNICHAIN_CHAIN_INFO, UNICHAIN_SEPOLIA_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/unichain'
import { WORLD_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/worldchain'
import { ZKSYNC_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/zksync'
import { ZORA_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/zora'
import { SOLANA_CHAIN_INFO } from 'uniswap/src/features/chains/svm/info/solana'
import { UniverseChainId, UniverseChainInfo } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getNonEmptyArrayOrThrow } from 'utilities/src/primitives/array'

export function getChainInfo(chainId: UniverseChainId): UniverseChainInfo {
  return UNIVERSE_CHAIN_INFO[chainId]
}

export const ORDERED_CHAINS = [
  MAINNET_CHAIN_INFO,
  UNICHAIN_CHAIN_INFO,
  SOLANA_CHAIN_INFO,
  POLYGON_CHAIN_INFO,
  ARBITRUM_CHAIN_INFO,
  OPTIMISM_CHAIN_INFO,
  BASE_CHAIN_INFO,
  BNB_CHAIN_INFO,
  BLAST_CHAIN_INFO,
  AVALANCHE_CHAIN_INFO,
  CELO_CHAIN_INFO,
  WORLD_CHAIN_INFO,
  SONEIUM_CHAIN_INFO,
  ZORA_CHAIN_INFO,
  ZKSYNC_CHAIN_INFO,
  SEPOLIA_CHAIN_INFO,
  UNICHAIN_SEPOLIA_CHAIN_INFO,
  MONAD_CHAIN_INFO,
] as const satisfies UniverseChainInfo[]

type ConstChainInfo<P extends Platform = Platform> = Extract<(typeof ORDERED_CHAINS)[number], { platform: P }>

function getOrderedEVMChains(): ConstChainInfo<Platform.EVM>[] {
  const evmChains: ConstChainInfo<Platform.EVM>[] = []
  for (const chain of ORDERED_CHAINS) {
    if (chain.platform === Platform.EVM) {
      evmChains.push(chain)
    }
  }
  return evmChains
}

export const ALL_CHAIN_IDS: UniverseChainId[] = ORDERED_CHAINS.map((chain) => chain.id)

// Exported with narrow typing for viem config typing on web. Will throw if no EVM chain is provided in ORDERED_CHAINS.
export const ORDERED_EVM_CHAINS = getNonEmptyArrayOrThrow(getOrderedEVMChains())

export const ALL_EVM_CHAIN_IDS = ORDERED_EVM_CHAINS.map((chain) => chain.id)

// Typing ensures the `UNIVERSE_CHAIN_INFO` map contains a proper mapping for each item defined in `ORDERED_EVM_CHAINS` (all keys defined & keys match corresponding value's `id` field)
type AllChainsMap = {
  [chainId in UniverseChainId]: Extract<ConstChainInfo, { id: chainId }>
}

export const UNIVERSE_CHAIN_INFO = {
  // MAINNETS
  [UniverseChainId.Mainnet]: MAINNET_CHAIN_INFO,
  [UniverseChainId.Unichain]: UNICHAIN_CHAIN_INFO,
  [UniverseChainId.Polygon]: POLYGON_CHAIN_INFO,
  [UniverseChainId.ArbitrumOne]: ARBITRUM_CHAIN_INFO,
  [UniverseChainId.Optimism]: OPTIMISM_CHAIN_INFO,
  [UniverseChainId.Base]: BASE_CHAIN_INFO,
  [UniverseChainId.Bnb]: BNB_CHAIN_INFO,
  [UniverseChainId.Blast]: BLAST_CHAIN_INFO,
  [UniverseChainId.Avalanche]: AVALANCHE_CHAIN_INFO,
  [UniverseChainId.Celo]: CELO_CHAIN_INFO,
  [UniverseChainId.WorldChain]: WORLD_CHAIN_INFO,
  [UniverseChainId.Soneium]: SONEIUM_CHAIN_INFO,
  [UniverseChainId.Zora]: ZORA_CHAIN_INFO,
  [UniverseChainId.Zksync]: ZKSYNC_CHAIN_INFO,

  // TESTNET
  [UniverseChainId.MonadTestnet]: MONAD_CHAIN_INFO,
  [UniverseChainId.Sepolia]: SEPOLIA_CHAIN_INFO,
  [UniverseChainId.UnichainSepolia]: UNICHAIN_SEPOLIA_CHAIN_INFO,

  // SVM
  [UniverseChainId.Solana]: SOLANA_CHAIN_INFO,
} as const satisfies AllChainsMap

export const GQL_MAINNET_CHAINS = ORDERED_EVM_CHAINS.filter((chain) => !chain.testnet).map(
  (chain) => chain.backendChain.chain,
)

export const GQL_TESTNET_CHAINS = ORDERED_EVM_CHAINS.filter((chain) => chain.testnet).map(
  (chain) => chain.backendChain.chain,
)

// If limit support expands beyond Mainnet, refactor to use a `supportsLimits`
// property on chain info objects and filter chains, similar to the pattern used above
export const LIMIT_SUPPORTED_CHAINS = [UniverseChainId.Mainnet]
