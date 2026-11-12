import { UniverseChainId } from '@universe/chains'
import { useIsDarkMode } from '@universe/mycelium'
import type { GeneratedIcon } from '@universe/mycelium/icons'
import { BlockExplorer } from '@universe/mycelium/icons/BlockExplorer'
import { ArbiscanLogoDark } from '@universe/mycelium/logos/ArbiscanLogoDark'
import { ArbiscanLogoLight } from '@universe/mycelium/logos/ArbiscanLogoLight'
import { EtherscanLogoDark } from '@universe/mycelium/logos/EtherscanLogoDark'
import { EtherscanLogoLight } from '@universe/mycelium/logos/EtherscanLogoLight'
import { OpEtherscanLogoDark } from '@universe/mycelium/logos/OpEtherscanLogoDark'
import { OpEtherscanLogoLight } from '@universe/mycelium/logos/OpEtherscanLogoLight'
import { PolygonscanLogoDark } from '@universe/mycelium/logos/PolygonscanLogoDark'
import { PolygonscanLogoLight } from '@universe/mycelium/logos/PolygonscanLogoLight'
import { SolscanLogoDark } from '@universe/mycelium/logos/SolscanLogoDark'
import { SolscanLogoLight } from '@universe/mycelium/logos/SolscanLogoLight'

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
  [UniverseChainId.Arc]: BlockExplorer,
  [UniverseChainId.Avalanche]: BlockExplorer,
  [UniverseChainId.Base]: EtherscanLogoLight,
  [UniverseChainId.Bnb]: EtherscanLogoLight,
  [UniverseChainId.Celo]: BlockExplorer,
  [UniverseChainId.Ink]: BlockExplorer,
  [UniverseChainId.Elysium]: BlockExplorer,
  [UniverseChainId.Linea]: EtherscanLogoLight,
  [UniverseChainId.MegaETH]: BlockExplorer,
  [UniverseChainId.Monad]: BlockExplorer,
  [UniverseChainId.Optimism]: OpEtherscanLogoLight,
  [UniverseChainId.Polygon]: PolygonscanLogoLight,
  [UniverseChainId.Robinhood]: BlockExplorer,
  [UniverseChainId.Sepolia]: EtherscanLogoLight,
  [UniverseChainId.Solana]: SolscanLogoLight,
  [UniverseChainId.Soneium]: BlockExplorer,
  [UniverseChainId.Tempo]: BlockExplorer,
  [UniverseChainId.XLayer]: BlockExplorer,
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
  [UniverseChainId.Linea]: EtherscanLogoDark,
  [UniverseChainId.Optimism]: OpEtherscanLogoDark,
  [UniverseChainId.Polygon]: PolygonscanLogoDark,
  [UniverseChainId.Sepolia]: EtherscanLogoDark,
  [UniverseChainId.Solana]: SolscanLogoDark,
}
