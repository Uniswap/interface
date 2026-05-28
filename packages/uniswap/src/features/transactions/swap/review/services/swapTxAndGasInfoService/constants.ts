export class UnknownSimulationError extends Error {
  constructor() {
    super('Unknown gas simulation error')
    this.name = 'UnknownSimulationError'
  }
}

export class SlippageTooLowError extends Error {
  constructor() {
    super('Slippage too low')
    this.name = 'SlippageTooLowError'
  }
}

// TODO(UniswapX): add fallback gas limits per chain? l2s have higher costs
export const WRAP_FALLBACK_GAS_LIMIT_IN_GWEI = 45_000

export const FALLBACK_SWAP_REQUEST_POLL_INTERVAL_MS = 1000
