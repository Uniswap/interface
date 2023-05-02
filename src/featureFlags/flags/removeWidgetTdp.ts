import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useWidgetRemovalFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.removeWidget, BaseVariant.Control)
}

export function useWidgetRemovalEnabled(): boolean {
  return useWidgetRemovalFlag() === BaseVariant.Enabled
}

export { BaseVariant as WidgetRemovalVariant }
