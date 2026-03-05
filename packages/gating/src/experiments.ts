/**
 * Experiment parameter names. Ordered alphabetically.
 *
 * These must match parameter names on Statsig within an experiment
 */
export enum Experiments {
  EthAsErc20UniswapX = 'eth_as_erc20_uniswapx_experiment',
  ExploreBackendSorting = 'explore_backend_sorting',
  NativeTokenPercentageBuffer = 'lp_native_buffer',
  PriceUxUpdate = 'price_ux_update',
  PrivateRpc = 'private_rpc',
  SwapConfirmation = 'swap-confirmation',
  UnichainFlashblocksModal = 'unichain_flashblocks_modal',
}

export enum Layers {
  ExplorePage = 'explore-page',
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

export enum PrivateRpcProperties {
  FlashbotsEnabled = 'flashbots_enabled',
  RefundPercent = 'refund_percent',
}

export enum NativeTokenPercentageBufferProperties {
  BufferSize = 'bufferSize',
}

export enum SwapConfirmationProperties {
  WaitTimes = 'wait_times',
}

export enum ExploreBackendSortingProperties {
  BackendSortingEnabled = 'backendSortingEnabled',
}

// Swap Layer experiment properties

export enum SwapLayerProperties {
  UpdatedPriceUX = 'updatedPriceUX',
  FlashblocksModalEnabled = 'flashblocksModalEnabled',
  EthAsErc20UniswapXEnabled = 'ethAsErc20UniswapXEnabled',
  MinEthErc20USDValueThresholdByChain = 'minEthErc20USDValueThresholdByChain',
}

export enum PriceUxUpdateProperties {
  UpdatedPriceUX = SwapLayerProperties.UpdatedPriceUX,
}

export enum UnichainFlashblocksProperties {
  FlashblocksModalEnabled = SwapLayerProperties.FlashblocksModalEnabled,
}

export enum EthAsErc20UniswapXProperties {
  EthAsErc20UniswapXEnabled = SwapLayerProperties.EthAsErc20UniswapXEnabled,
  MinEthErc20USDValueThresholdByChain = SwapLayerProperties.MinEthErc20USDValueThresholdByChain,
}

// Ordered alphabetically.
export type ExperimentProperties = {
  [Experiments.EthAsErc20UniswapX]: EthAsErc20UniswapXProperties
  [Experiments.ExploreBackendSorting]: ExploreBackendSortingProperties
  [Experiments.NativeTokenPercentageBuffer]: NativeTokenPercentageBufferProperties
  [Experiments.PriceUxUpdate]: PriceUxUpdateProperties
  [Experiments.PrivateRpc]: PrivateRpcProperties
  [Experiments.SwapConfirmation]: SwapConfirmationProperties
  [Experiments.UnichainFlashblocksModal]: UnichainFlashblocksProperties
}

// will be a spread of all experiment properties in that layer
export const LayerProperties: Record<Layers, string[]> = {
  [Layers.ExplorePage]: Object.values({
    ...ExploreBackendSortingProperties,
  }),
  [Layers.SwapPage]: Object.values(SwapLayerProperties),
}
