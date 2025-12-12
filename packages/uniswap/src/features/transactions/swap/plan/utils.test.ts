jest.mock('uniswap/src/config', () => ({
  config: {
    tradingApiKey: 'test-api-key',
  },
}))

jest.mock('uniswap/src/data/apiClients/tradingApi/TradingApiClient', () => ({
  TradingApiClient: {
    updateExistingPlan: jest.fn(),
  },
}))

jest.mock('utilities/src/time/timing', () => ({
  sleep: jest.fn().mockResolvedValue(true),
}))

jest.mock('utilities/src/logger/logger', () => ({
  logger: {
    warn: jest.fn(),
  },
}))

import { TradingApi, UpdatePlanRequestWithPlanId } from '@universe/api'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { updateExistingPlanWithRetry } from 'uniswap/src/features/transactions/swap/plan/utils'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { sleep } from 'utilities/src/time/timing'

describe('updateExistingPlanWithRetry', () => {
  const mockUpdateExistingPlan = TradingApiClient.updateExistingPlan as jest.Mock
  const mockSleep = sleep as jest.Mock
  const mockLoggerWarn = logger.warn as jest.Mock

  const mockParams: UpdatePlanRequestWithPlanId = {
    planId: 'test-plan-id',
    steps: [
      {
        stepIndex: 0,
        proof: {
          txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
      },
    ],
  }

  const mockPlanResponse: TradingApi.PlanResponse = {
    requestId: 'test-request-id',
    planId: 'test-plan-id',
    swapper: '0x0000000000000000000000000000000000000000',
    recipient: '0x0000000000000000000000000000000000000000',
    quoteId: 'test-quote-id',
    status: TradingApi.PlanStatus.IN_PROGRESS,
    steps: [
      {
        stepIndex: 0,
        method: TradingApi.PlanStepMethod.SEND_TX,
        payloadType: TradingApi.PlanStepPayloadType.TX,
        payload: {},
        status: TradingApi.PlanStepStatus.AWAITING_ACTION,
      },
    ],
    currentStepIndex: 0,
    expectedOutput: '1000000000000000000',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return plan response on first successful attempt', async () => {
    mockUpdateExistingPlan.mockResolvedValueOnce(mockPlanResponse)
    const result = await updateExistingPlanWithRetry(mockParams)
    expect(result).toEqual(mockPlanResponse)
    expect(mockUpdateExistingPlan).toHaveBeenCalledTimes(1)
    expect(mockUpdateExistingPlan).toHaveBeenCalledWith(mockParams)
    expect(mockSleep).not.toHaveBeenCalled()
    expect(mockLoggerWarn).not.toHaveBeenCalled()
  })

  it('should retry multiple times and succeed', async () => {
    const error = new Error('Network error')
    mockUpdateExistingPlan
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(mockPlanResponse)
    const result = await updateExistingPlanWithRetry(mockParams)
    expect(result).toEqual(mockPlanResponse)
    expect(mockUpdateExistingPlan).toHaveBeenCalledTimes(3)
    expect(mockSleep).toHaveBeenCalledTimes(2)
    expect(mockSleep).toHaveBeenNthCalledWith(1, ONE_SECOND_MS * 1)
    expect(mockSleep).toHaveBeenNthCalledWith(2, ONE_SECOND_MS * 2)
    expect(mockLoggerWarn).toHaveBeenCalledTimes(2)
  })

  it('should throw error after max retries exceeded', async () => {
    const error = new Error('Network error')
    const maxRetries = 3
    mockUpdateExistingPlan.mockRejectedValue(error)
    await expect(updateExistingPlanWithRetry(mockParams, maxRetries)).rejects.toThrow()
    expect(mockUpdateExistingPlan).toHaveBeenCalledTimes(maxRetries)
    expect(mockSleep).toHaveBeenCalledTimes(maxRetries - 1)
    expect(mockLoggerWarn).toHaveBeenCalledTimes(maxRetries - 1)
  })
})
