/**
 * Experiment parameter names. Ordered alphabetically.
 *
 * These must match parameter names on Statsig within an experiment
 */
export enum Experiments {
  EmbeddedWalletOnboarding = 'embedded_wallet_onboarding',
  EthAsErc20UniswapX = 'eth_as_erc20_uniswapx_experiment',
  NativeTokenPercentageBuffer = 'lp_native_buffer',
  SwapConfirmation = 'swap-confirmation',
  V2EndpointsSearch = 'v2_endpoints_search_experiment',
}

export enum Layers {
  // Explore, token details, and search surfaces (web + mobile)
  Discovery = 'discovery',
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

export enum EmbeddedWalletOnboardingProperties {
  NewFlowEnabled = 'newFlowEnabled',
}

export enum NativeTokenPercentageBufferProperties {
  BufferSize = 'bufferSize',
}

export enum SwapConfirmationProperties {
  WaitTimes = 'wait_times',
}

// Discovery Layer experiment properties

export enum DiscoveryLayerProperties {
  V2EndpointsSearchEnabled = 'v2EndpointsSearchEnabled',
}

export enum V2EndpointsSearchProperties {
  V2EndpointsSearchEnabled = DiscoveryLayerProperties.V2EndpointsSearchEnabled,
}

// Swap Layer experiment properties

export enum SwapLayerProperties {
  EthAsErc20UniswapXEnabled = 'ethAsErc20UniswapXEnabled',
  MinEthErc20USDValueThresholdByChain = 'minEthErc20USDValueThresholdByChain',
}

export enum EthAsErc20UniswapXProperties {
  EthAsErc20UniswapXEnabled = SwapLayerProperties.EthAsErc20UniswapXEnabled,
  MinEthErc20USDValueThresholdByChain = SwapLayerProperties.MinEthErc20USDValueThresholdByChain,
}

// Ordered alphabetically.
export type ExperimentProperties = {
  [Experiments.EmbeddedWalletOnboarding]: EmbeddedWalletOnboardingProperties
  [Experiments.EthAsErc20UniswapX]: EthAsErc20UniswapXProperties
  [Experiments.NativeTokenPercentageBuffer]: NativeTokenPercentageBufferProperties
  [Experiments.SwapConfirmation]: SwapConfirmationProperties
  [Experiments.V2EndpointsSearch]: V2EndpointsSearchProperties
}

// will be a spread of all experiment properties in that layer
export const LayerProperties: Record<Layers, string[]> = {
  [Layers.Discovery]: Object.values(DiscoveryLayerProperties),
  [Layers.SwapPage]: Object.values(SwapLayerProperties),
}
