import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useGatewayDNSUpdateEnabledFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.gatewayDNSUpdate)
}

export function useGatewayDNSUpdateEnabled(): boolean {
  return useGatewayDNSUpdateEnabledFlag() === BaseVariant.Enabled
}

export function useGatewayDNSUpdateAllEnabledFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.gatewayDNSUpdateAll)
}

export function useGatewayDNSUpdateAllEnabled(): boolean {
  return useGatewayDNSUpdateAllEnabledFlag() === BaseVariant.Enabled
}
