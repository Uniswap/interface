import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useEip6963EnabledFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.eip6963Enabled)
}

export function useEip6963Enabled(): boolean {
  return useEip6963EnabledFlag() === BaseVariant.Enabled
}
