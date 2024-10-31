import { BlockExplorer } from 'ui/src/components/icons/BlockExplorer'
import { ArbiscanLogoDark } from 'ui/src/components/logos/ArbiscanLogoDark'
import { ArbiscanLogoLight } from 'ui/src/components/logos/ArbiscanLogoLight'
import { EtherscanLogoDark } from 'ui/src/components/logos/EtherscanLogoDark'
import { EtherscanLogoLight } from 'ui/src/components/logos/EtherscanLogoLight'
import { OpEtherscanLogoDark } from 'ui/src/components/logos/OpEtherscanLogoDark'
import { OpEtherscanLogoLight } from 'ui/src/components/logos/OpEtherscanLogoLight'
import { PolygonscanLogoDark } from 'ui/src/components/logos/PolygonscanLogoDark'
import { PolygonscanLogoLight } from 'ui/src/components/logos/PolygonscanLogoLight'
import { UniverseChainId, UniverseChainLogoInfo } from 'uniswap/src/types/chains'

// Keeping this separate from UNIVERSE_CHAIN_INFO to avoid import issues on extension content script
export const UNIVERSE_CHAIN_LOGO = {
  [UniverseChainId.Mainnet]: {
    explorer: {
      logoLight: EtherscanLogoLight,
      logoDark: EtherscanLogoDark,
    },
  } as const satisfies UniverseChainLogoInfo,
  [UniverseChainId.Sepolia]: {
    explorer: {
      logoLight: EtherscanLogoLight,
      logoDark: EtherscanLogoDark,
    },
  } as const satisfies UniverseChainLogoInfo,
  [UniverseChainId.ArbitrumOne]: {
    explorer: {
      logoLight: ArbiscanLogoLight,
      logoDark: ArbiscanLogoDark,
    },
  } as const satisfies UniverseChainLogoInfo,
  [UniverseChainId.Optimism]: {
    explorer: {
      logoLight: OpEtherscanLogoLight,
      logoDark: OpEtherscanLogoDark,
    },
  } as const satisfies UniverseChainLogoInfo,
  [UniverseChainId.Base]: {
    explorer: {
      logoLight: EtherscanLogoLight,
      logoDark: EtherscanLogoDark,
    },
  } as const satisfies UniverseChainLogoInfo,
  [UniverseChainId.Bnb]: {
    explorer: {
      logoLight: EtherscanLogoLight,
      logoDark: EtherscanLogoDark,
    },
  } as const satisfies UniverseChainLogoInfo,
  [UniverseChainId.Polygon]: {
    explorer: {
      logoLight: PolygonscanLogoLight,
      logoDark: PolygonscanLogoDark,
    },
  } as const satisfies UniverseChainLogoInfo,
  [UniverseChainId.Blast]: {
    explorer: {
      logoLight: BlockExplorer,
      logoDark: BlockExplorer,
    },
  } as const satisfies UniverseChainLogoInfo,
  [UniverseChainId.Avalanche]: {
    explorer: {
      logoLight: BlockExplorer,
      logoDark: BlockExplorer,
    },
  } as const satisfies UniverseChainLogoInfo,
  [UniverseChainId.Celo]: {
    explorer: {
      logoLight: BlockExplorer,
      logoDark: BlockExplorer,
    },
  } as const satisfies UniverseChainLogoInfo,
  [UniverseChainId.WorldChain]: {
    explorer: {
      logoLight: BlockExplorer,
      logoDark: BlockExplorer,
    },
  } as const satisfies UniverseChainLogoInfo,
  [UniverseChainId.Zora]: {
    explorer: {
      logoLight: BlockExplorer,
      logoDark: BlockExplorer,
    },
  } as const satisfies UniverseChainLogoInfo,
  [UniverseChainId.Zksync]: {
    explorer: {
      logoLight: BlockExplorer,
      logoDark: BlockExplorer,
    },
  } as const satisfies UniverseChainLogoInfo,
  [UniverseChainId.AstrochainSepolia]: {
    explorer: {
      logoLight: BlockExplorer,
      logoDark: BlockExplorer,
    },
  } as const satisfies UniverseChainLogoInfo,
}
