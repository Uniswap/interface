import { DEPRECATED_RPC_PROVIDERS, RPC_PROVIDERS } from 'constants/providers'
import { FeatureFlags } from 'uniswap/src/features/experiments/flags'
import { useFeatureFlag } from 'uniswap/src/features/experiments/hooks'

export function useNetworkProviders() {
  return useFeatureFlag(FeatureFlags.FallbackProvider) ? RPC_PROVIDERS : DEPRECATED_RPC_PROVIDERS
}
