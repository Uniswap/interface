/**
 * Experiment parameter names
 *
 * These must match parameter names on Statsig within an experiment
 */
export enum Experiments {
  SwapPresets = 'swap_presets',
  PriceUxUpdate = 'price_ux_update',
  PrivateRpc = 'private_rpc',
  NativeTokenPercentageBuffer = 'lp_native_buffer',
}

export enum Layers {
  SwapPage = 'swap-page',
}

// experiment groups

export enum NativeTokenPercentageBufferExperimentGroup {
  Control = 'Control',
  Buffer1 = 'Buffer1',
}

// experiment properties

export enum ArbitrumXV2SamplingProperties {
  RoutingType = 'routingType',
}

export enum SwapPresetsProperties {
  InputEnabled = 'inputEnabled',
  OutputEnabled = 'outputEnabled',
}

export enum PriceUxUpdateProperties {
  UpdatedPriceUX = 'updatedPriceUX',
}

export enum PrivateRpcProperties {
  FlashbotsEnabled = 'flashbots_enabled',
  RefundPercent = 'refund_percent',
}

export enum NativeTokenPercentageBufferProperties {
  BufferSize = 'bufferSize',
}

export type ExperimentProperties = {
  [Experiments.SwapPresets]: SwapPresetsProperties
  [Experiments.PriceUxUpdate]: PriceUxUpdateProperties
  [Experiments.PrivateRpc]: PrivateRpcProperties
  [Experiments.NativeTokenPercentageBuffer]: NativeTokenPercentageBufferProperties
}

// will be a spread of all experiment properties in that layer
export const LayerProperties: Record<Layers, string[]> = {
  [Layers.SwapPage]: Object.values({ ...SwapPresetsProperties, ...PriceUxUpdateProperties }),
}
