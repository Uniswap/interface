import { TradingApi } from '@universe/api'
import {
  calculatePlanCompoundSlippage,
  getPlanCompoundSlippageTolerance,
} from 'uniswap/src/features/transactions/swap/plan/slippage'

describe('slippage', () => {
  describe('calculatePlanCompoundSlippage', () => {
    it('returns undefined for empty array', () => {
      expect(calculatePlanCompoundSlippage([])).toBeUndefined()
    })

    it('returns single value unchanged', () => {
      expect(calculatePlanCompoundSlippage([0.5])).toBe(0.5)
      expect(calculatePlanCompoundSlippage([1.0])).toBe(1.0)
      expect(calculatePlanCompoundSlippage([0])).toBe(0)
    })

    it('calculates compound slippage for two values', () => {
      // 0.5% and 0.25%: 1 - (0.995 * 0.9975) = 1 - 0.9925125 = 0.0074875 = 0.74875%
      const result = calculatePlanCompoundSlippage([0.5, 0.25])
      expect(result).toBeCloseTo(0.74875, 5)
    })

    it('calculates compound slippage for three values', () => {
      // 0.5%, 0.5%, 0.5%: 1 - (0.995^3) = 1 - 0.985074875 = 1.4925125%
      const result = calculatePlanCompoundSlippage([0.5, 0.5, 0.5])
      expect(result).toBeCloseTo(1.492512, 5)
    })

    it('handles zero slippage values', () => {
      // 0% and 0.5%: 1 - (1 * 0.995) = 0.5%
      expect(calculatePlanCompoundSlippage([0, 0.5])).toBeCloseTo(0.5, 5)
      expect(calculatePlanCompoundSlippage([0, 0])).toBe(0)
    })

    it('handles high slippage values', () => {
      // 5% and 5%: 1 - (0.95 * 0.95) = 1 - 0.9025 = 9.75%
      const result = calculatePlanCompoundSlippage([5, 5])
      expect(result).toBeCloseTo(9.75, 5)
    })

    it('handles floating-point precision correctly', () => {
      // Multiple small values should not accumulate precision errors
      const result = calculatePlanCompoundSlippage([0.1, 0.1, 0.1, 0.1, 0.1])
      // 1 - (0.999)^5 = 0.499001...%
      expect(result).toBeDefined()
      expect(typeof result).toBe('number')
      // Should be rounded to 6 decimal places
      expect(result!.toString().split('.')[1]?.length ?? 0).toBeLessThanOrEqual(6)
    })
  })

  describe('getPlanCompoundSlippageTolerance', () => {
    const createMockStep = (stepType: TradingApi.PlanStepType, slippage?: number): TradingApi.PlanStep => {
      const step = {
        stepIndex: 0,
        stepType,
        status: TradingApi.PlanStepStatus.AWAITING_ACTION,
        method: TradingApi.PlanStepMethod.SEND_TX,
        payload: {},
      } as TradingApi.PlanStep

      if (slippage !== undefined) {
        step.slippage = slippage
      }

      return step
    }

    it('returns undefined for undefined steps', () => {
      expect(getPlanCompoundSlippageTolerance(undefined)).toBeUndefined()
    })

    it('returns undefined for empty steps', () => {
      expect(getPlanCompoundSlippageTolerance([])).toBeUndefined()
    })

    it('returns undefined when no steps have slippage', () => {
      const steps = [createMockStep(TradingApi.PlanStepType.BRIDGE), createMockStep(TradingApi.PlanStepType.WRAP)]
      expect(getPlanCompoundSlippageTolerance(steps)).toBeUndefined()
    })

    it('returns single slippage unchanged', () => {
      const steps = [createMockStep(TradingApi.PlanStepType.CLASSIC, 0.5)]
      expect(getPlanCompoundSlippageTolerance(steps)).toBe(0.5)
    })

    it('calculates compound slippage for multiple swap steps', () => {
      const steps = [
        createMockStep(TradingApi.PlanStepType.CLASSIC, 0.5),
        createMockStep(TradingApi.PlanStepType.CLASSIC, 0.25),
      ]
      const result = getPlanCompoundSlippageTolerance(steps)
      // 1 - (0.995 * 0.9975) = 0.74875%
      expect(result).toBeCloseTo(0.74875, 5)
    })

    it('skips steps without slippage in compound calculation', () => {
      const steps = [
        createMockStep(TradingApi.PlanStepType.CLASSIC, 0.5),
        createMockStep(TradingApi.PlanStepType.BRIDGE), // No slippage
        createMockStep(TradingApi.PlanStepType.CLASSIC, 0.25),
      ]
      const result = getPlanCompoundSlippageTolerance(steps)
      // Should only compound 0.5% and 0.25%, ignoring BRIDGE
      // 1 - (0.995 * 0.9975) = 0.74875%
      expect(result).toBeCloseTo(0.74875, 5)
    })

    it('handles real-world chained action scenario', () => {
      // Typical cross-chain swap: CLASSIC -> BRIDGE -> CLASSIC
      const steps = [
        createMockStep(TradingApi.PlanStepType.APPROVAL_TXN), // No slippage
        createMockStep(TradingApi.PlanStepType.CLASSIC, 0.5),
        createMockStep(TradingApi.PlanStepType.BRIDGE), // No slippage
        createMockStep(TradingApi.PlanStepType.CLASSIC, 0.25),
      ]
      const result = getPlanCompoundSlippageTolerance(steps)
      // Should compound 0.5% and 0.25%
      expect(result).toBeCloseTo(0.74875, 5)
    })
  })
})
