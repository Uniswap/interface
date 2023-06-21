import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useWalletConnectV2Flag(): BaseVariant {
  return useBaseFlag(FeatureFlag.walletConnectV2)
}

export function useWalletConnectV2AsDefault(): boolean {
  return useWalletConnectV2Flag() === BaseVariant.Enabled
}
