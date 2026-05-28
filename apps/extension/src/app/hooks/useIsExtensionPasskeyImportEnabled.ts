import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export function useIsExtensionPasskeyImportEnabled(): boolean {
  return useFeatureFlag(FeatureFlags.EmbeddedWallet)
}
