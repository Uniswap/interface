import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useLandingPageV2Flag(): BaseVariant {
  return useBaseFlag(FeatureFlag.landingPageV2)
}

export function useNewLandingPage(): boolean {
  return useLandingPageV2Flag() === BaseVariant.Enabled
}

export function useExitAnimationFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.exitAnimation)
}

export function useExitAnimation(): boolean {
  return useExitAnimationFlag() === BaseVariant.Enabled
}
