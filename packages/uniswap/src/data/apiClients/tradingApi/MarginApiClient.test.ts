import { TradingApi } from '@universe/api'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Two seams here. The margin fetch client (createTradingApiFetchClient) still backs fetchMarginQuote,
// so it is stubbed to assert that wire contract. The four PLAN methods now delegate to the shared
// chained-plan client, so TradingApiSessionClient is mocked and the plan tests assert delegation +
// the response/request adapters. The shared client's own PATCH-cancel wire contract is covered in
// createTradingApiClient.test.ts.
const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  createNewPlan: vi.fn(),
  getExistingPlan: vi.fn(),
  updateExistingPlan: vi.fn(),
  cancelExistingPlan: vi.fn(),
}))

vi.mock('@universe/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/api')>()
  return {
    ...actual,
    createTradingApiFetchClient: vi.fn(() => ({
      context: () => ({}),
      fetch: vi.fn(),
      get: vi.fn(),
      post: mocks.post,
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
    })),
  }
})

vi.mock('uniswap/src/data/apiClients/tradingApi/TradingApiSessionClient', () => ({
  TradingApiSessionClient: {
    createNewPlan: mocks.createNewPlan,
    getExistingPlan: mocks.getExistingPlan,
    updateExistingPlan: mocks.updateExistingPlan,
    cancelExistingPlan: mocks.cancelExistingPlan,
    fetchPlan: vi.fn(),
    refreshExistingPlan: vi.fn(),
  },
}))

import {
  MarginApiClient,
  type MarginQuoteRequest,
  type MarginQuoteResponse,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'

// A shared chained-plan response (what POST/GET/PATCH /plan return), with the margin identity
// projected onto marginIntent. The four MarginApiClient plan methods adapt this back to the
// hand-written MarginPlanResponse the executor consumes.
function fakeSharedPlanResponse(overrides: Partial<TradingApi.PlanResponse> = {}): TradingApi.PlanResponse {
  return {
    requestId: 'req-1',
    planId: 'plan-42',
    swapper: '0xswapper',
    recipient: '0xswapper',
    quoteId: 'q-1',
    status: TradingApi.PlanStatus.ACTIVE,
    currentStepIndex: 0,
    expectedOutput: '0',
    steps: [],
    marginIntent: {
      intent: 'OPEN',
      subId: '0',
      marketKey: 'mk',
      collateralToken: '0xcollateral',
      debtToken: '0xdebt',
      venue: 'MORPHO',
    },
    ...overrides,
  }
}

function fakeQuoteResponse(overrides: Partial<MarginQuoteResponse> = {}): MarginQuoteResponse {
  return {
    requestId: 'req-1',
    // The verbatim wire execution the adapter carries through; POST /plan reads exactly this.
    execution: fakeWireQuoteResponse().execution,
    action: 'increaseLeverage',
    chainId: 1,
    swapper: '0xswapper',
    direction: TradingApi.MarginDirection.LONG,
    exposureToken: { address: '0xcollateral', chainId: 1, decimals: 18 },
    counterToken: { address: '0xdebt', chainId: 1, decimals: 6 },
    positionId: '3',
    leverageTarget: '3',
    slippageTolerance: 0.5,
    display: {
      size: '1200',
      leverage: '3',
      healthFactor: '1800000000000000000',
      liquidationPrice: '900000000000000000',
    },
    legs: [
      {
        venue: 'MORPHO',
        collateralToken: '0xcollateral',
        debtToken: '0xdebt',
        subId: '3',
        equityShare: '1000000000000000000',
        bounds: {
          venue: 'MORPHO',
          subId: '3',
          leverageTarget: '3',
          increase: { collateralToBuy: '200', maxDebtIn: '410' },
        },
      },
    ],
    gasEstimate: { gasLimit: '21000', gasFeeWei: '1000000000000000' },
    deadlineSuggestion: '1753290000',
    ...overrides,
  }
}

// The wire envelope the POST actually returns (execution/operations/funding); fetchMarginQuote adapts
// it to the view fixture above. Shaped to the generated types so a wire rename fails to compile here.
function fakeWireQuoteResponse(): TradingApi.MarginQuoteResponse {
  return {
    requestId: 'req-1',
    execution: {
      positionChainId: 1,
      swapper: '0xswapper',
      exposureToken: '0xcollateral',
      counterToken: '0xdebt',
      direction: TradingApi.MarginDirection.LONG,
      intent: TradingApi.MarginIntent.MARGIN_INTENT_INCREASE_LEVERAGE,
      positionId: '3',
      leverageTarget: '3',
      slippageTolerance: 0.5,
      legs: [
        {
          venue: TradingApi.MarginVenue.MORPHO,
          subId: '3',
          operations: [
            { type: TradingApi.MarginOperationType.INCREASE_POSITION, collateralToBuy: '200', maxDebtIn: '410' },
          ],
        },
      ],
    },
    display: {
      size: '1200',
      leverage: '3',
      healthFactor: '1800000000000000000',
      liquidationPrice: '900000000000000000',
    },
    gasEstimate: { eip1559: { gasLimit: '21000', gasFee: '1000000000000000' } },
  }
}

describe('MarginApiClient plan methods (shared /plan facade)', () => {
  beforeEach(() => {
    mocks.createNewPlan.mockReset()
    mocks.getExistingPlan.mockReset()
    mocks.updateExistingPlan.mockReset()
    mocks.cancelExistingPlan.mockReset()
  })

  it('createMarginPlan posts a CHAINED body with the proto-shaped marginQuote (requestId + execution only)', async () => {
    mocks.createNewPlan.mockResolvedValue(fakeSharedPlanResponse())
    const marginQuote = fakeQuoteResponse()

    await MarginApiClient.createMarginPlan({ chainId: 1, swapper: '0xswapper', marginQuote })

    // POST /plan strict-decodes marginQuote as the proto MarginQuoteResponse; the flat display view's
    // extra keys (action, swapper, paymentSwap, …) make it reject. Only the wire fields are echoed.
    expect(mocks.createNewPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        routing: 'CHAINED',
        marginQuote: { requestId: marginQuote.requestId, execution: marginQuote.execution },
      }),
    )
  })

  it('createMarginPlan throws for a RECOVER request (no shared /plan representation yet)', async () => {
    await expect(
      MarginApiClient.createMarginPlan({ chainId: 1, swapper: '0xswapper', intent: 'RECOVER' }),
    ).rejects.toThrow(/RECOVER/)
    expect(mocks.createNewPlan).not.toHaveBeenCalled()
  })

  it('getMarginPlan maps marginIntent + steps onto the execution model', async () => {
    mocks.getExistingPlan.mockResolvedValue(
      fakeSharedPlanResponse({
        status: TradingApi.PlanStatus.AWAITING_ACTION,
        steps: [
          {
            stepIndex: 0,
            method: TradingApi.PlanStepMethod.SEND_TX,
            payloadType: TradingApi.PlanStepPayloadType.TX,
            payload: { to: '0xto', data: '0x', chainId: 1 },
            status: TradingApi.PlanStepStatus.AWAITING_ACTION,
            stepType: TradingApi.PlanStepType.MARGIN_OPEN,
            tokenIn: '0xin',
            fillDeadline: '1753290000',
            estFillTimeSec: 30,
          },
        ],
      }),
    )

    const result = await MarginApiClient.getMarginPlan({ planId: 'plan-42' })

    expect(mocks.getExistingPlan).toHaveBeenCalledWith({ planId: 'plan-42' })
    expect(result).toMatchObject({
      planId: 'plan-42',
      intent: 'OPEN',
      marketKey: 'mk',
      venue: 'MORPHO',
      collateralToken: '0xcollateral',
      debtToken: '0xdebt',
      subId: '0',
      status: 'AWAITING_ACTION',
    })
    expect(result.steps[0]).toMatchObject({
      stepIndex: 0,
      stepType: 'MARGIN_OPEN',
      method: 'SEND_TX',
      payloadType: 'TX',
      status: 'AWAITING_ACTION',
      tokenIn: '0xin',
      fillDeadline: '1753290000',
      estFillTimeSec: 30,
    })
  })

  // The shared plan service types funding legs with its OWN generic step types; the executor's
  // fund-safety validators and step handling key off the margin twins. Without this remap a token-funded
  // open reaches the loop tagged CLASSIC and matches no margin handler. Untested until now, so dropping
  // an entry would have shipped silently.
  it.each([
    [TradingApi.PlanStepType.CLASSIC, 'MARGIN_PRE_SWAP'],
    [TradingApi.PlanStepType.WRAP, 'MARGIN_PRE_SWAP'],
    [TradingApi.PlanStepType.UNWRAP, 'MARGIN_PRE_SWAP'],
    [TradingApi.PlanStepType.BRIDGE, 'MARGIN_BRIDGE'],
  ])('getMarginPlan relabels the %s funding leg as %s', async (wireStepType, expected) => {
    mocks.getExistingPlan.mockResolvedValue(
      fakeSharedPlanResponse({
        status: TradingApi.PlanStatus.AWAITING_ACTION,
        steps: [
          {
            stepIndex: 0,
            method: TradingApi.PlanStepMethod.SEND_TX,
            payloadType: TradingApi.PlanStepPayloadType.TX,
            payload: { to: '0xto', data: '0x', chainId: 1 },
            status: TradingApi.PlanStepStatus.AWAITING_ACTION,
            stepType: wireStepType,
          },
        ],
      }),
    )

    const result = await MarginApiClient.getMarginPlan({ planId: 'plan-42' })

    expect(result.steps[0]?.stepType).toBe(expected)
  })

  // Anything already margin-typed passes through untouched — the remap must not rewrite venue or
  // approval steps on its way past them.
  it('getMarginPlan leaves an already margin-typed step alone', async () => {
    mocks.getExistingPlan.mockResolvedValue(
      fakeSharedPlanResponse({
        status: TradingApi.PlanStatus.AWAITING_ACTION,
        steps: [
          {
            stepIndex: 0,
            method: TradingApi.PlanStepMethod.SEND_TX,
            payloadType: TradingApi.PlanStepPayloadType.TX,
            payload: { to: '0xto', data: '0x', chainId: 1 },
            status: TradingApi.PlanStepStatus.AWAITING_ACTION,
            stepType: TradingApi.PlanStepType.MARGIN_CLOSE,
          },
        ],
      }),
    )

    const result = await MarginApiClient.getMarginPlan({ planId: 'plan-42' })

    expect(result.steps[0]?.stepType).toBe('MARGIN_CLOSE')
  })

  // The deployed plan service emits ONE MARGIN_EXECUTE step for every margin action and names the action
  // only on marginIntent.intent (the proto enum's full member name). Resolve it back to the action step
  // type the executor and activity extractor branch on, and collapse the wire intent to the FE vocabulary.
  it.each([
    ['MARGIN_INTENT_OPEN', 'OPEN', 'MARGIN_OPEN'],
    ['MARGIN_INTENT_CLOSE', 'CLOSE', 'MARGIN_CLOSE'],
    ['MARGIN_INTENT_INCREASE_LEVERAGE', 'ADJUST', 'MARGIN_ADJUST'],
    ['MARGIN_INTENT_ADD_EQUITY', 'ADJUST', 'MARGIN_ADJUST'],
  ])(
    'getMarginPlan resolves a MARGIN_EXECUTE step under %s to intent %s / step %s',
    async (wireIntent, expectedIntent, expectedStepType) => {
      mocks.getExistingPlan.mockResolvedValue(
        fakeSharedPlanResponse({
          status: TradingApi.PlanStatus.AWAITING_ACTION,
          marginIntent: {
            intent: wireIntent,
            subId: '0',
            marketKey: 'mk',
            collateralToken: '0xcollateral',
            debtToken: '0xdebt',
            venue: 'MORPHO',
          },
          steps: [
            {
              stepIndex: 0,
              method: TradingApi.PlanStepMethod.SEND_TX,
              payloadType: TradingApi.PlanStepPayloadType.TX,
              payload: { to: '0xto', data: '0x', chainId: 1 },
              status: TradingApi.PlanStepStatus.AWAITING_ACTION,
              stepType: TradingApi.PlanStepType.MARGIN_EXECUTE,
            },
          ],
        }),
      )

      const result = await MarginApiClient.getMarginPlan({ planId: 'plan-42' })

      expect(result.intent).toBe(expectedIntent)
      expect(result.steps[0]?.stepType).toBe(expectedStepType)
    },
  )

  it('getMarginPlan throws when the plan carries no marginIntent', async () => {
    mocks.getExistingPlan.mockResolvedValue(fakeSharedPlanResponse({ marginIntent: undefined }))

    await expect(MarginApiClient.getMarginPlan({ planId: 'plan-42' })).rejects.toThrow(/marginIntent/)
  })

  it('updateMarginPlan forwards planId + step proofs to the shared client', async () => {
    mocks.updateExistingPlan.mockResolvedValue(fakeSharedPlanResponse())
    const steps = [{ stepIndex: 1, proof: { txHash: '0xhash' } }]

    await MarginApiClient.updateMarginPlan({ planId: 'plan-42', steps })

    expect(mocks.updateExistingPlan).toHaveBeenCalledWith({ planId: 'plan-42', steps })
  })

  it('cancelMarginPlan cancels via the shared client and adapts the response', async () => {
    mocks.cancelExistingPlan.mockResolvedValue(fakeSharedPlanResponse({ status: TradingApi.PlanStatus.CANCELLED }))

    const result = await MarginApiClient.cancelMarginPlan({ planId: 'plan-42' })

    expect(mocks.cancelExistingPlan).toHaveBeenCalledWith({ planId: 'plan-42' })
    expect(result.status).toBe('CANCELLED')
  })
})

describe('MarginApiClient.fetchMarginQuote', () => {
  beforeEach(() => {
    mocks.post.mockReset()
    mocks.post.mockResolvedValue(fakeWireQuoteResponse())
  })

  // Every manage action goes to the one dispatcher — /margin/close_quote and
  // /margin/adjust_quote are retired routes.
  it('POSTs to margin/quote with the action-keyed request body', async () => {
    const request: MarginQuoteRequest = {
      positionChainId: 1,
      exposureToken: '0xcollateral',
      counterToken: '0xdebt',
      direction: TradingApi.MarginDirection.LONG,
      swapper: '0xswapper',
      slippageTolerance: 0.5,
      increaseLeverage: { positionId: '3', leverageTarget: '3' },
    }
    mocks.post.mockResolvedValue(fakeWireQuoteResponse())

    const result = await MarginApiClient.fetchMarginQuote(request, { tokenDecimals: { exposure: 18, counter: 6 } })

    expect(mocks.post).toHaveBeenCalledWith(
      expect.stringContaining('margin/quote'),
      expect.objectContaining({ body: JSON.stringify(request) }),
    )
    expect(result.requestId).toBe('req-1')
    // POST /plan reads `marginQuote.execution` (and re-derives every bound from it), so the adapter
    // must carry the wire execution subtree through UNTOUCHED rather than only the flat display view.
    expect(result.execution).toEqual(fakeWireQuoteResponse().execution)
  })
})
