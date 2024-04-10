import { ChainId } from '@uniswap/sdk-core'
import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useOutageBannerOptimism(): BaseVariant {
  return useBaseFlag(FeatureFlag.outageBannerOptimism)
}

function useShowOutageBannerOptimism(): boolean {
  return useOutageBannerOptimism() === BaseVariant.Enabled
}

export function useOutageBannerArbitrum(): BaseVariant {
  return useBaseFlag(FeatureFlag.outageBannerArbitrum)
}

function useShowOutageBannerArbitrum(): boolean {
  return useOutageBannerArbitrum() === BaseVariant.Enabled
}

export function useOutageBannerPolygon(): BaseVariant {
  return useBaseFlag(FeatureFlag.outageBannerPolygon)
}

function useShowOutageBannerPolygon(): boolean {
  return useOutageBannerPolygon() === BaseVariant.Enabled
}

export function useOutageBanners(): Record<ChainId, boolean> {
  return {
    [ChainId.OPTIMISM]: useShowOutageBannerOptimism(),
    [ChainId.ARBITRUM_ONE]: useShowOutageBannerArbitrum(),
    [ChainId.POLYGON]: useShowOutageBannerPolygon(),

    [ChainId.MAINNET]: false,
    [ChainId.GOERLI]: false,
    [ChainId.SEPOLIA]: false,
    [ChainId.OPTIMISM_GOERLI]: false,
    [ChainId.OPTIMISM_SEPOLIA]: false,
    [ChainId.ARBITRUM_GOERLI]: false,
    [ChainId.ARBITRUM_SEPOLIA]: false,
    [ChainId.POLYGON_MUMBAI]: false,
    [ChainId.CELO]: false,
    [ChainId.CELO_ALFAJORES]: false,
    [ChainId.GNOSIS]: false,
    [ChainId.MOONBEAM]: false,
    [ChainId.BNB]: false,
    [ChainId.AVALANCHE]: false,
    [ChainId.BASE_GOERLI]: false,
    [ChainId.BASE]: false,
  }
}
