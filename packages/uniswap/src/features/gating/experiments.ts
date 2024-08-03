/**
 * Experiment parameter names
 *
 * These must match parameter names on Statsig within an experiment
 */
export enum Experiments {
  ArbitrumXV2OpenOrders = 'arbitrum_uniswapx_openorders',
}

export enum ArbitrumXV2OpenOrderProperties {
  PriceImprovementBps = 'priceImprovementBps',
  ForceOpenOrders = 'forceOpenOrders',
  DeadlineBufferSecs = 'deadlineBufferSecs',
}

export type ExperimentProperties = {
  [Experiments.ArbitrumXV2OpenOrders]: ArbitrumXV2OpenOrderProperties
}
