import { useIsDarkMode } from 'ui/src'
import { GeneratedIcon } from 'ui/src/components/factories/createIcon'
import { BlockExplorer } from 'ui/src/components/icons/BlockExplorer'
import { EtherscanLogoDark } from 'ui/src/components/logos/EtherscanLogoDark'
import { EtherscanLogoLight } from 'ui/src/components/logos/EtherscanLogoLight'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

// Keeping this separate from UNIVERSE_CHAIN_INFO to avoid import issues on extension content script
export function useBlockExplorerLogo(chainId?: UniverseChainId): GeneratedIcon {
  const isDarkMode = useIsDarkMode()
  if (!chainId) {
    return BlockExplorer
  }
  return isDarkMode ? BLOCK_EXPLORER_LOGOS_DARK[chainId] : BLOCK_EXPLORER_LOGOS_LIGHT[chainId]
}

const BLOCK_EXPLORER_LOGOS_LIGHT: Partial<Record<UniverseChainId, GeneratedIcon>> = {
  [UniverseChainId.Mainnet]: EtherscanLogoLight,
}

const BLOCK_EXPLORER_LOGOS_DARK: Partial<Record<UniverseChainId, GeneratedIcon>> = {
  ...BLOCK_EXPLORER_LOGOS_LIGHT,
  [UniverseChainId.Mainnet]: EtherscanLogoDark,
}
