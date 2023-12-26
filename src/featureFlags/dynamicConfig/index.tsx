import { DynamicConfig, useConfig } from 'statsig-react'

export enum DynamicConfigName {
  quickRouteChains = 'quick_route_chains',
}

export function useDynamicConfig(configName: DynamicConfigName): DynamicConfig {
  const { config } = useConfig(configName)
  return config
}
