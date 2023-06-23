import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useRoutingAPIForPriceFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.routingAPIPrice)
}

export function useRoutingAPIForPrice(): boolean {
  return useRoutingAPIForPriceFlag() === BaseVariant.Enabled
}
