import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useAlternateTxSourceFlag() {
  return useBaseFlag(FeatureFlag.alternateTxSource)
}

export function useAlternateTxSourceFlagEnabled(): boolean {
  return useAlternateTxSourceFlag() === BaseVariant.Enabled
}
