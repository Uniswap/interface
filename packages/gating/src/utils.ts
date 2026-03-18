import { PrecomputedEvaluationsInterface } from '@statsig/js-client'
import { getOverrideAdapter } from '@universe/gating/src/sdk/statsig'

export function isStatsigReady(client: PrecomputedEvaluationsInterface): boolean {
  return client.loadingStatus === 'Ready'
}

type GateOverride = [string, boolean]
type ConfigOverride = [string, Record<string, unknown>]

export function getOverrides(client: PrecomputedEvaluationsInterface): {
  configOverrides: ConfigOverride[]
  gateOverrides: GateOverride[]
} {
  const statsigOverrides = isStatsigReady(client)
    ? getOverrideAdapter().getAllOverrides()
    : { gate: {}, dynamicConfig: {}, layer: {} }

  const filterNumbers = (value: [string, unknown]): boolean => isNaN(parseInt(value[0], 10))
  const gateOverrides = Object.entries(statsigOverrides.gate).filter(filterNumbers)
  const configOverrides = Object.entries(statsigOverrides.dynamicConfig).filter(filterNumbers)

  return { configOverrides, gateOverrides }
}
