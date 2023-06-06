import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useNativeUSDCArbitrumFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.nativeUsdcArbitrum)
}

export function useNativeUSDCArbitrumEnabled(): boolean {
  return useNativeUSDCArbitrumFlag() === BaseVariant.Enabled
}
