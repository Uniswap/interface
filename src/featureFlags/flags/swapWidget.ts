import { useGate } from 'statsig-react'

import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useSwapWidgetFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.swapWidget, BaseVariant.Control)
}

export function useSwapWidgetEnabled(): boolean {
  const { value: statsigValue } = useGate(FeatureFlag.swapWidget)
  return useSwapWidgetFlag() === BaseVariant.Enabled || statsigValue
}

export { BaseVariant as SwapWidgetVariant }
