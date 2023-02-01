import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

function useSwapWidgetFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.swapWidget, BaseVariant.Control)
}

export function useSwapWidgetEnabled(): boolean {
  return useSwapWidgetFlag() === BaseVariant.Enabled
}
