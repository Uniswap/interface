/**
 * Experiment parameter names
 *
 * These must match parameter names on Statsig within an experiment
 */
export enum Experiments {
  ArbitrumXV2OpenOrders = 'arbitrum_uniswapx_openorders',
}

export type ExperimentProperties = {
  [Experiments.ArbitrumXV2OpenOrders]: 'priceImprovementBps' | 'forceOpenOrders' | 'deadlineBufferSecs'
}
