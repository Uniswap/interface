import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useAndroidGALaunchFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.androidGALaunch)
}

// todo(kristiehuang): add statsig flag after staging goes out
export function useAndroidGALaunchFlagEnabled(): boolean {
  return useAndroidGALaunchFlag() === BaseVariant.Enabled
}
