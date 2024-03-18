import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useExitAnimationFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.exitAnimation)
}

export function useExitAnimation(): boolean {
  return useExitAnimationFlag() === BaseVariant.Enabled
}
