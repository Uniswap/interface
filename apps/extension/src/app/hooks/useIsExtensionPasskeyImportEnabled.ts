import { FeatureFlags, useFeatureFlag } from '@universe/gating'

export function useIsExtensionPasskeyImportEnabled(): boolean {
  return useFeatureFlag(FeatureFlags.EmbeddedWallet)
}
