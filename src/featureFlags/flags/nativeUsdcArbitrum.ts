import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

function useNativeUSDCArbitrumFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.nativeUsdcArbitrum)
}

export function useNativeUSDCArbitrumEnabled(): boolean {
  return useNativeUSDCArbitrumFlag() === BaseVariant.Enabled
}
