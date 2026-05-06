import { createUtilities } from '@universe/chains'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'

export const { isAddress, namehash, parseUnits, zeroAddress } = createUtilities({
  getViemEnabled: () => getFeatureFlag(FeatureFlags.ViemEnabled),
})
