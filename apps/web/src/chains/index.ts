import { createTransactions, createUtilities } from '@universe/chains'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'

const ctx = { getViemEnabled: () => getFeatureFlag(FeatureFlags.ViemEnabled) }

export const { formatUnits, isAddress, namehash, parseUnits, zeroAddress } = createUtilities(ctx)
export const { signTypedData } = createTransactions(ctx)
