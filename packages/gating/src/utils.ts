import { _getInstance, StatsigClientEventCallback } from '@statsig/client-core'
import { PrecomputedEvaluationsInterface } from '@statsig/js-client'
import { getConfig } from '@universe/config'
import { getOverrideAdapter, getStatsigClient } from '@universe/gating/src/sdk/statsig'

export function isStatsigReady(client: PrecomputedEvaluationsInterface): boolean {
  return client.loadingStatus === 'Ready'
}

/**
 * Peeks the Statsig registry without invoking `StatsigClient.instance()` — calling
 * `.instance()` on an empty registry creates a broken fallback client that gets
 * cached permanently. Use before any pre-React Statsig access.
 */
export function isStatsigClientRegistered(): boolean {
  try {
    return _getInstance(getConfig().statsigApiKey) != null
  } catch {
    return false
  }
}

const DEFAULT_STATSIG_READY_TIMEOUT_MS = 5000

/**
 * Returns a promise that resolves when the Statsig client is ready.
 * Use this in non-React contexts where you need gate values but can't use hooks.
 * Falls back after timeout to avoid blocking indefinitely.
 */
export function waitForStatsigReady(timeoutMs = DEFAULT_STATSIG_READY_TIMEOUT_MS): Promise<void> {
  const client = getStatsigClient()
  if (client.loadingStatus === 'Ready') {
    return Promise.resolve()
  }
  return new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      client.off('values_updated', handler)
      resolve()
    }, timeoutMs)
    const handler: StatsigClientEventCallback<'values_updated'> = (event): void => {
      if (event.status === 'Ready') {
        clearTimeout(timer)
        client.off('values_updated', handler)
        resolve()
      }
    }
    client.on('values_updated', handler)
    // Re-check after subscribing to avoid race between initial check and listener registration
    if (client.loadingStatus === 'Ready') {
      clearTimeout(timer)
      client.off('values_updated', handler)
      resolve()
    }
  })
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
