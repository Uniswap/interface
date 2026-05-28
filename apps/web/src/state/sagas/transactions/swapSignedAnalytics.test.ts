import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  clearLoggedSwapSignedPlanSteps,
  resetLoggedSwapSignedPlanSteps,
  sendSwapSignedEvent,
} from '~/state/sagas/transactions/swapSignedAnalytics'

function createSwapSignedProperties(
  overrides: Partial<Parameters<typeof sendSwapSignedEvent>[0]['properties']> = {},
): Parameters<typeof sendSwapSignedEvent>[0]['properties'] {
  return {
    transactionOriginType: 'internal',
    ...overrides,
  } as Parameters<typeof sendSwapSignedEvent>[0]['properties']
}

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))

describe('sendSwapSignedEvent', () => {
  beforeEach(() => {
    resetLoggedSwapSignedPlanSteps()
    vi.clearAllMocks()
  })

  it('suppresses duplicate final-step swap signed events for the same plan step', () => {
    const analytics = {
      plan_id: 'plan-123',
      step_index: 2,
      is_final_step: true,
    }

    sendSwapSignedEvent({
      analytics,
      properties: createSwapSignedProperties(analytics),
    })
    sendSwapSignedEvent({
      analytics,
      properties: createSwapSignedProperties(analytics),
    })

    expect(sendAnalyticsEvent).toHaveBeenCalledTimes(1)
  })

  it('still emits swap signed events for different plan steps', () => {
    sendSwapSignedEvent({
      analytics: {
        plan_id: 'plan-123',
        step_index: 1,
        is_final_step: false,
      },
      properties: createSwapSignedProperties({ plan_id: 'plan-123', step_index: 1 }),
    })
    sendSwapSignedEvent({
      analytics: {
        plan_id: 'plan-123',
        step_index: 2,
        is_final_step: true,
      },
      properties: createSwapSignedProperties({ plan_id: 'plan-123', step_index: 2 }),
    })

    expect(sendAnalyticsEvent).toHaveBeenCalledTimes(2)
  })

  it('does not dedupe non-plan swap signed events', () => {
    sendSwapSignedEvent({
      analytics: {},
      properties: createSwapSignedProperties({ transaction_hash: '0x1' }),
    })
    sendSwapSignedEvent({
      analytics: {},
      properties: createSwapSignedProperties({ transaction_hash: '0x2' }),
    })

    expect(sendAnalyticsEvent).toHaveBeenCalledTimes(2)
  })

  it('allows the same plan step to emit again after plan cleanup', () => {
    const analytics = {
      plan_id: 'plan-123',
      step_index: 2,
      is_final_step: true,
    }

    sendSwapSignedEvent({
      analytics,
      properties: createSwapSignedProperties(analytics),
    })
    clearLoggedSwapSignedPlanSteps('plan-123')
    sendSwapSignedEvent({
      analytics,
      properties: createSwapSignedProperties(analytics),
    })

    expect(sendAnalyticsEvent).toHaveBeenCalledTimes(2)
  })
})
