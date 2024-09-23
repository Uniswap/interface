import { BlockExplorer } from 'ui/src/components/icons'
import {
  ArbiscanLogoDark,
  ArbiscanLogoLight,
  EtherscanLogoDark,
  EtherscanLogoLight,
  OpEtherscanLogoDark,
  OpEtherscanLogoLight,
  PolygonscanLogoDark,
  PolygonscanLogoLight,
} from 'ui/src/components/logos'
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
  [UniverseChainId.Goerli]: {
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
  [UniverseChainId.ArbitrumGoerli]: {
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
  [UniverseChainId.OptimismGoerli]: {
    explorer: {
      logoLight: OpEtherscanLogoLight,
      logoDark: OpEtherscanLogoDark,
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
  [UniverseChainId.PolygonMumbai]: {
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
  [UniverseChainId.CeloAlfajores]: {
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
}
