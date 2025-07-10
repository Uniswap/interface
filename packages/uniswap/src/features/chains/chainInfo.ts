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
import { ALL_CHAIN_IDS, UniverseChainId, UniverseChainInfo } from 'uniswap/src/features/chains/types'

export function getChainInfo(chainId: UniverseChainId): UniverseChainInfo {
  return UNIVERSE_CHAIN_INFO[chainId]
}

export const UNIVERSE_CHAIN_INFO = {
  [UniverseChainId.Mainnet]: MAINNET_CHAIN_INFO,
  [UniverseChainId.ArbitrumOne]: ARBITRUM_CHAIN_INFO,
  [UniverseChainId.Avalanche]: AVALANCHE_CHAIN_INFO,
  [UniverseChainId.Base]: BASE_CHAIN_INFO,
  [UniverseChainId.Blast]: BLAST_CHAIN_INFO,
  [UniverseChainId.Bnb]: BNB_CHAIN_INFO,
  [UniverseChainId.Celo]: CELO_CHAIN_INFO,
  [UniverseChainId.MonadTestnet]: MONAD_CHAIN_INFO,
  [UniverseChainId.Optimism]: OPTIMISM_CHAIN_INFO,
  [UniverseChainId.Polygon]: POLYGON_CHAIN_INFO,
  [UniverseChainId.Sepolia]: SEPOLIA_CHAIN_INFO,
  [UniverseChainId.Soneium]: SONEIUM_CHAIN_INFO,
  [UniverseChainId.Unichain]: UNICHAIN_CHAIN_INFO,
  [UniverseChainId.UnichainSepolia]: UNICHAIN_SEPOLIA_CHAIN_INFO,
  [UniverseChainId.WorldChain]: WORLD_CHAIN_INFO,
  [UniverseChainId.Zksync]: ZKSYNC_CHAIN_INFO,
  [UniverseChainId.Zora]: ZORA_CHAIN_INFO,
} as const satisfies Record<UniverseChainId, UniverseChainInfo>

function getUniverseChainsSorted(): (typeof UNIVERSE_CHAIN_INFO)[UniverseChainId][] {
  const sortOrder = new Map(ALL_CHAIN_IDS.map((chainId, idx) => [chainId, idx]))
  return Object.values(UNIVERSE_CHAIN_INFO).sort((a, b) => {
    const indexA = sortOrder.get(a.id) ?? Infinity
    const indexB = sortOrder.get(b.id) ?? Infinity
    return indexA - indexB
  })
}
export const UNIVERSE_CHAINS_SORTED = getUniverseChainsSorted()

export const GQL_MAINNET_CHAINS = Object.values(UNIVERSE_CHAIN_INFO)
  .filter((chain) => !chain.testnet)
  .map((chain) => chain.backendChain.chain)

export const GQL_TESTNET_CHAINS = Object.values(UNIVERSE_CHAIN_INFO)
  .filter((chain) => chain.testnet)
  .map((chain) => chain.backendChain.chain)
