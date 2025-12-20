import { useIsDarkMode } from 'ui/src'
import { GeneratedIcon } from 'ui/src/components/factories/createIcon'
import { BlockExplorer } from 'ui/src/components/icons/BlockExplorer'
import { ArbiscanLogoDark } from 'ui/src/components/logos/ArbiscanLogoDark'
import { ArbiscanLogoLight } from 'ui/src/components/logos/ArbiscanLogoLight'
import { EtherscanLogoDark } from 'ui/src/components/logos/EtherscanLogoDark'
import { EtherscanLogoLight } from 'ui/src/components/logos/EtherscanLogoLight'
import { OpEtherscanLogoDark } from 'ui/src/components/logos/OpEtherscanLogoDark'
import { OpEtherscanLogoLight } from 'ui/src/components/logos/OpEtherscanLogoLight'
import { PolygonscanLogoDark } from 'ui/src/components/logos/PolygonscanLogoDark'
import { PolygonscanLogoLight } from 'ui/src/components/logos/PolygonscanLogoLight'
import { SolscanLogoDark } from 'ui/src/components/logos/SolscanLogoDark'
import { SolscanLogoLight } from 'ui/src/components/logos/SolscanLogoLight'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

// Keeping this separate from UNIVERSE_CHAIN_INFO to avoid import issues on extension content script
export function useBlockExplorerLogo(chainId?: UniverseChainId): GeneratedIcon {
  const isDarkMode = useIsDarkMode()
  if (!chainId) {
    return BlockExplorer
  }
  return isDarkMode ? BLOCK_EXPLORER_LOGOS_DARK[chainId] : BLOCK_EXPLORER_LOGOS_LIGHT[chainId]
}

const BLOCK_EXPLORER_LOGOS_LIGHT: Record<UniverseChainId, GeneratedIcon> = {
  [UniverseChainId.Mainnet]: EtherscanLogoLight,
  [UniverseChainId.ArbitrumOne]: ArbiscanLogoLight,
  [UniverseChainId.Avalanche]: BlockExplorer,
  [UniverseChainId.Base]: EtherscanLogoLight,
  [UniverseChainId.Blast]: BlockExplorer,
  [UniverseChainId.Bnb]: EtherscanLogoLight,
  [UniverseChainId.Celo]: BlockExplorer,
  [UniverseChainId.Monad]: BlockExplorer,
  [UniverseChainId.Optimism]: OpEtherscanLogoLight,
  [UniverseChainId.Polygon]: PolygonscanLogoLight,
  [UniverseChainId.Sepolia]: EtherscanLogoLight,
  [UniverseChainId.Solana]: SolscanLogoLight,
  [UniverseChainId.Soneium]: BlockExplorer,
  [UniverseChainId.Unichain]: BlockExplorer,
  [UniverseChainId.UnichainSepolia]: BlockExplorer,
  [UniverseChainId.WorldChain]: BlockExplorer,
  [UniverseChainId.Zksync]: BlockExplorer,
  [UniverseChainId.Zora]: BlockExplorer,
}

const BLOCK_EXPLORER_LOGOS_DARK: Record<UniverseChainId, GeneratedIcon> = {
  ...BLOCK_EXPLORER_LOGOS_LIGHT,
  [UniverseChainId.Mainnet]: EtherscanLogoDark,
  [UniverseChainId.ArbitrumOne]: ArbiscanLogoDark,
  [UniverseChainId.Base]: EtherscanLogoDark,
  [UniverseChainId.Bnb]: EtherscanLogoDark,
  [UniverseChainId.Optimism]: OpEtherscanLogoDark,
  [UniverseChainId.Polygon]: PolygonscanLogoDark,
  [UniverseChainId.Sepolia]: EtherscanLogoDark,
  [UniverseChainId.Solana]: SolscanLogoDark,
}
