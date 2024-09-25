import AsyncStorage from '@react-native-async-storage/async-storage'
import { Statsig, StatsigOverrides } from 'uniswap/src/features/gating/sdk/statsig'
import { isDevEnv } from 'utilities/src/environment/env'
import { logger } from 'utilities/src/logger/logger'

const STATSIG_PERSISTED_OVERRIDE_KEY = 'STATSIG_PERSISTED_OVERRIDE_KEY'

/**
 * Used to load persisted overrides from AsyncStorage.
 * This entire module should only be used in development.
 * TODO MOB-3375 This can be removed after migrating to the new Statsig JS SDK that should handle this.
 */
export function loadStatsigOverrides(): void {
  if (isDevEnv()) {
    const load = async (): Promise<void> => {
      try {
        const stored = await AsyncStorage.getItem(STATSIG_PERSISTED_OVERRIDE_KEY)
        if (stored) {
          const overrides = JSON.parse(stored) as StatsigOverrides

          for (const [gate, value] of Object.entries(overrides.gates)) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            Statsig.overrideGate(gate, value, false)
          }

          for (const [config, value] of Object.entries(overrides.configs)) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            Statsig.overrideConfig(config, value, false)
          }

          for (const [layer, value] of Object.entries(overrides.layers)) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            Statsig.overrideLayer(layer, value, false)
          }
        }
      } catch (error) {
        logger.debug('persistedOverrides', 'useLoadStatsigOverrides', `Failed to load persisted overrides: ${error}`)
      }
    }

    load().catch(() => {})
  }
}

// This entire section is meant to update storage after Statsig override actions
if (isDevEnv()) {
  function syncWithStorage(): void {
    const overrides = Statsig.getAllOverrides()
    AsyncStorage.setItem(STATSIG_PERSISTED_OVERRIDE_KEY, JSON.stringify(overrides)).catch((error) => {
      logger.debug('persistedOverrides', 'persistOverrides', error)
    })
  }

  const overrideConfig = Statsig.overrideConfig.bind(Statsig)
  Statsig.overrideConfig = (configName: string, value: object, persist: boolean = true): void => {
    overrideConfig(configName, value)
    if (persist) {
      syncWithStorage()
    }
  }

  const overrideGate = Statsig.overrideGate.bind(Statsig)
  Statsig.overrideGate = (gateName: string, value: boolean, persist: boolean = true): void => {
    overrideGate(gateName, value)
    if (persist) {
      syncWithStorage()
    }
  }

  const overrideLayer = Statsig.overrideLayer.bind(Statsig)
  Statsig.overrideLayer = (layerName: string, value: object, persist: boolean = true): void => {
    overrideLayer(layerName, value)
    if (persist) {
      syncWithStorage()
    }
  }

  const removeGateOverride = Statsig.removeGateOverride.bind(Statsig)
  Statsig.removeGateOverride = (name?: string | undefined): void => {
    removeGateOverride(name)
    syncWithStorage()
  }

  const removeConfigOverride = Statsig.removeConfigOverride.bind(Statsig)
  Statsig.removeConfigOverride = (name?: string | undefined): void => {
    removeConfigOverride(name)
    syncWithStorage()
  }

  const removeLayerOverride = Statsig.removeLayerOverride.bind(Statsig)
  Statsig.removeLayerOverride = (name?: string | undefined): void => {
    removeLayerOverride(name)
    syncWithStorage()
  }
}
