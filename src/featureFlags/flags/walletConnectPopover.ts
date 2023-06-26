import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useWalletConnectFallbackFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.walletConnectFallback)
}

export function useWalletConnectFallback(): boolean {
  return useWalletConnectFallbackFlag() === BaseVariant.Enabled
}
