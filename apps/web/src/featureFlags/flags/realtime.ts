import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useRealtimeFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.realtime)
}

export function useIsRealtimeEnabled(): boolean {
  return useRealtimeFlag() === BaseVariant.Enabled
}
