import { LocalOverrideAdapter } from '@statsig/js-local-overrides'
import { getStatsigClient } from '@universe/gating/src/sdk/statsig'

// Workaround for @statsig 3.x.x refreshing client after applying overrides to get the result without reloading
// Should be removed after statsig add real time override apply functionality
// Adds refresh only to used LocalOverrideAdapter methods. Other methods need to be added if refresh is required.
export class LocalOverrideAdapterWrapper extends LocalOverrideAdapter {
  constructor(sdkKey: string) {
    super(sdkKey)
  }

  refreshStatsig(): void {
    const statsigClient = getStatsigClient()
    const statsigUser = statsigClient.getContext().user
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    statsigClient.updateUserAsync(statsigUser)
  }

  overrideGate(name: string, value: boolean): void {
    super.overrideGate(name, value)
    this.refreshStatsig()
  }

  overrideDynamicConfig(name: string, value: Record<string, unknown>): void {
    super.overrideDynamicConfig(name, value)
    this.refreshStatsig()
  }

  removeDynamicConfigOverride(name: string): void {
    super.removeDynamicConfigOverride(name)
    this.refreshStatsig()
  }

  removeAllOverrides(): void {
    super.removeAllOverrides()
    this.refreshStatsig()
  }

  removeExperimentOverride(name: string): void {
    super.removeExperimentOverride(name)
    this.refreshStatsig()
  }

  overrideExperiment(name: string, value: Record<string, unknown>): void {
    super.overrideExperiment(name, value)
    this.refreshStatsig()
  }

  overrideLayer(name: string, value: Record<string, unknown>): void {
    super.overrideLayer(name, value)
    this.refreshStatsig()
  }

  removeLayerOverride(name: string): void {
    super.removeLayerOverride(name)
    this.refreshStatsig()
  }
}
