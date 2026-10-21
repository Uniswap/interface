import { GatedFeature, useIsFeatureGated } from '@universe/compliance'

/**
 * Whether the caller's region is blocked from the fiat on- or off-ramp. UX only: fails open while
 * pending so a cold cache never flashes the block. The FOR backend enforces the block server-side.
 */
export function useIsForRegionBlocked({ isOfframp }: { isOfframp: boolean }): boolean {
  return useIsFeatureGated(isOfframp ? GatedFeature.FIAT_OFFRAMP : GatedFeature.FIAT_ONRAMP)
}
