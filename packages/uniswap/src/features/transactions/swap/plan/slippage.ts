import { TradingApi } from '@universe/api'

/**
 * Calculates compound slippage from individual step slippages.
 * Formula: compoundSlippage = 1 - ((1-s1) × (1-s2) × ... × (1-sn))
 *
 * @param slippages - Array of slippage percentages (e.g., 0.5 for 0.5%)
 * @returns Compound slippage percentage, or undefined if empty
 */
export function calculatePlanCompoundSlippage(slippages: number[]): number | undefined {
  if (slippages.length === 0) {
    return undefined
  }
  if (slippages.length === 1) {
    return slippages[0]
  }

  const compoundFactor = slippages.reduce((acc, slip) => acc * (1 - slip / 100), 1)
  const compound = (1 - compoundFactor) * 100
  return Math.round(compound * 1_000_000) / 1_000_000
}

/**
 * Gets compound slippage tolerance for a chained action plan.
 */
export function getPlanCompoundSlippageTolerance(
  steps?: Array<TradingApi.PlanStep | TradingApi.TruncatedPlanStep>,
): number | undefined {
  if (!steps) {
    return undefined
  }

  const slippageValues = steps.map((step) => step.slippage).filter((s): s is number => s !== undefined)

  return calculatePlanCompoundSlippage(slippageValues)
}
