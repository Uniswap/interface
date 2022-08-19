import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useWalletFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.wallet)
}

export { BaseVariant as WalletVariant }
