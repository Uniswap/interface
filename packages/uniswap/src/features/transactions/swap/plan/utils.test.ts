import { TradingApi } from '@universe/api'
import { findFirstActiveStep } from 'uniswap/src/features/transactions/swap/plan/utils'

describe('findFirstActiveStep', () => {
  const createMockStep = (overrides: Partial<TradingApi.PlanStep> = {}): TradingApi.PlanStep =>
    ({
      stepIndex: 0,
      status: TradingApi.PlanStepStatus.AWAITING_ACTION,
      method: TradingApi.PlanStepMethod.SEND_TX,
      payload: {},
      ...overrides,
    }) as TradingApi.PlanStep

  it('should return the correct first step with AWAITING_ACTION status', () => {
    const steps = [
      createMockStep({ stepIndex: 0, status: TradingApi.PlanStepStatus.COMPLETE }),
      createMockStep({ stepIndex: 1, status: TradingApi.PlanStepStatus.AWAITING_ACTION }),
      createMockStep({ stepIndex: 2, status: TradingApi.PlanStepStatus.NOT_READY }),
    ]

    const result = findFirstActiveStep(steps)

    expect(result.index).toBe(1)
    expect(result.step).toEqual(steps[1])
  })

  it('should return the first step when it has AWAITING_ACTION status', () => {
    const steps = [
      createMockStep({ stepIndex: 0, status: TradingApi.PlanStepStatus.AWAITING_ACTION }),
      createMockStep({ stepIndex: 1, status: TradingApi.PlanStepStatus.NOT_READY }),
    ]
    const result = findFirstActiveStep(steps)

    expect(result.index).toBe(0)
    expect(result.step).toEqual(steps[0])
  })

  it('should return the first step with IN_PROGRESS status', () => {
    const steps = [
      createMockStep({ stepIndex: 0, status: TradingApi.PlanStepStatus.COMPLETE }),
      createMockStep({ stepIndex: 1, status: TradingApi.PlanStepStatus.IN_PROGRESS }),
      createMockStep({ stepIndex: 2, status: TradingApi.PlanStepStatus.AWAITING_ACTION }),
    ]

    const result = findFirstActiveStep(steps)

    expect(result.index).toBe(1)
    expect(result.step).toEqual(steps[1])
  })

  it('should return the last step when all steps are complete', () => {
    const steps = [
      createMockStep({ stepIndex: 0, status: TradingApi.PlanStepStatus.COMPLETE }),
      createMockStep({ stepIndex: 1, status: TradingApi.PlanStepStatus.COMPLETE }),
      createMockStep({ stepIndex: 2, status: TradingApi.PlanStepStatus.COMPLETE }),
    ]

    const result = findFirstActiveStep(steps)

    expect(result.index).toBe(2)
    expect(result.step).toEqual(steps[2])
  })

  it('should return index -1 and undefined step when no active step exists', () => {
    const steps = [
      createMockStep({ stepIndex: 0, status: TradingApi.PlanStepStatus.STEP_ERROR }),
      createMockStep({ stepIndex: 1, status: TradingApi.PlanStepStatus.STEP_ERROR }),
    ]

    const result = findFirstActiveStep(steps)

    expect(result.index).toBe(-1)
    expect(result.step).toBeUndefined()
  })

  it('should return index -1 and undefined step for empty array', () => {
    const steps: TradingApi.PlanStep[] = []

    const result = findFirstActiveStep(steps)

    expect(result.index).toBe(-1)
    expect(result.step).toBeUndefined()
  })
  it('should handle mixed statuses correctly', () => {
    const steps = [
      createMockStep({ stepIndex: 0, status: TradingApi.PlanStepStatus.COMPLETE }),
      createMockStep({ stepIndex: 1, status: TradingApi.PlanStepStatus.STEP_ERROR }),
      createMockStep({ stepIndex: 2, status: TradingApi.PlanStepStatus.AWAITING_ACTION }),
      createMockStep({ stepIndex: 3, status: TradingApi.PlanStepStatus.NOT_READY }),
    ]

    const result = findFirstActiveStep(steps)

    expect(result.index).toBe(2)
    expect(result.step).toEqual(steps[2])
  })
})
