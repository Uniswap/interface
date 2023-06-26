import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useWalletConnectFallback(): BaseVariant {
  return useBaseFlag(FeatureFlag.walletConnectFallback)
}
