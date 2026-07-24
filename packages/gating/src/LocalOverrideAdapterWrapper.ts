import { LocalOverrideAdapter } from '@statsig/js-local-overrides'
import type { StatsigClient } from '@statsig/react-bindings'

// Workaround for @statsig 3.x.x refreshing client after applying overrides to get the result without reloading
// Should be removed after statsig add real time override apply functionality
// Adds refresh only to used LocalOverrideAdapter methods. Other methods need to be added if refresh is required.
export class LocalOverrideAdapterWrapper extends LocalOverrideAdapter {
  constructor(
    sdkKey: string,
    private readonly getClient: () => StatsigClient,
  ) {
    super(sdkKey)
  }

  refreshStatsig(): void {
    const statsigClient = this.getClient()
    const statsigUser = statsigClient.getContext().user
    // Overrides are local, so a sync re-evaluation from cached values surfaces them
    // immediately; updateUserAsync gated the UI update on a network round-trip.
    statsigClient.updateUserSync(statsigUser)
  }

  overrideGate(name: string, value: boolean): void {
    super.overrideGate(name, value)
    this.refreshStatsig()
  }

  removeGateOverride(name: string): void {
    super.removeGateOverride(name)
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
