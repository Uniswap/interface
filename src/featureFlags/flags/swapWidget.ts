import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useSwapWidgetFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.swapWidget, BaseVariant.Control)
}

export function useSwapWidgetEnabled(): boolean {
  return useSwapWidgetFlag() === BaseVariant.Enabled
}

export { BaseVariant as SwapWidgetVariant }
