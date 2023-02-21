/* eslint-disable import/no-unused-modules */

import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useMgtmFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.mgtm)
}

export function useMgtmEnabled(): boolean {
  return useMgtmFlag() === BaseVariant.Enabled
}

export function useMGTMMicrositeEnabled() {
  const mgtmEnabled = useMgtmEnabled()
  return useBaseFlag(FeatureFlag.walletMicrosite) === BaseVariant.Enabled && mgtmEnabled
}

export { BaseVariant as MgtmVariant }
