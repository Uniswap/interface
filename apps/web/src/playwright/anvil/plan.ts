// oxlint-disable-next-line no-restricted-imports -- Anvil route helpers need Playwright's Page type
import type { Page } from '@playwright/test'
import { PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { TradingApi } from '@universe/api'
// oxlint-disable-next-line universe-custom/no-direct-viem-ethers-import -- Node-side mock must not load the feature-gated app adapter
import { encodeFunctionData, erc20Abi, getAddress, type Address } from 'viem'
import {
  completePlanStep,
  getPlanPath,
  isPlanRoute,
  MAX_UINT256,
  PLAN_PATH,
  WETH_ABI,
} from '~/playwright/anvil/planLifecycle'

export { buildSendTxPlanStep } from '~/playwright/anvil/planLifecycle'

export function encodeApproveCalldata({
  spender,
  amount = MAX_UINT256,
}: {
  spender: Address
  amount?: bigint
}): `0x${string}` {
  return encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [spender, amount] })
}

export function encodeTransferCalldata({ recipient, amount }: { recipient: Address; amount: bigint }): `0x${string}` {
  return encodeFunctionData({ abi: erc20Abi, functionName: 'transfer', args: [recipient, amount] })
}

/** WETH9 deposit — pair with a `value` above the wallet balance to force a wallet-side submission failure. */
export function encodeWethDepositCalldata(): `0x${string}` {
  return encodeFunctionData({ abi: WETH_ABI, functionName: 'deposit' })
}

function requireString(value: string | undefined, label: string): string {
  if (!value) {
    throw new Error(`Chained swap mock received a request without ${label}`)
  }
  return value
}

/**
 * Returns a deterministic CHAINED quote for any /quote request, echoing the requested
 * tokens/amount so the swap form recognizes the pair it asked about. The hosted quote
 * service cannot see fork-only balances, so a live quote is not usable in Anvil tests.
 */
export async function installChainedSwapQuoteMock(page: Page): Promise<void> {
  let quoteCounter = 0

  await page.route(
    (url: URL): boolean => url.pathname === '/quote',
    async (route) => {
      const request = route.request().postDataJSON() as TradingApi.QuoteRequest
      const amount = requireString(request.amount, 'quote amount')
      const tokenIn = requireString(request.tokenIn, 'tokenIn')
      const tokenOut = requireString(request.tokenOut, 'tokenOut')
      const swapper = requireString(request.swapper, 'swapper')
      const quoteId = `chained-e2e-quote-${++quoteCounter}`

      const response: TradingApi.QuoteResponse = {
        requestId: `chained-e2e-${quoteId}`,
        routing: TradingApi.Routing.CHAINED,
        permitData: null,
        isTokenApprovalApplicable: false,
        quote: {
          swapper,
          input: { token: tokenIn, amount },
          output: { token: tokenOut, amount, recipient: request.recipient ?? swapper },
          tokenInChainId: request.tokenInChainId,
          tokenOutChainId: request.tokenOutChainId,
          tradeType: request.type,
          quoteId,
          gasUseEstimate: '500000',
          gasFeeUSD: '0.50',
          gasFeeQuote: '500000000000000',
          gasPrice: '1000000000',
          gasFee: '500000000000000',
          gasStrategies: [],
          steps: [
            {
              stepType: TradingApi.PlanStepType.CLASSIC,
              tokenIn,
              tokenInChainId: request.tokenInChainId,
              tokenOut,
              tokenOutChainId: request.tokenOutChainId,
            },
          ],
        },
      }

      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) })
    },
  )
}

/**
 * Deterministic Permit2 PermitSingle typed data; exported so tests can recover the signer
 * address (viem-native value types — bigints are stringified when embedded in a step payload).
 */
export function buildPermit2TypedData({
  token,
  spender,
  amount,
}: {
  token: Address
  spender: Address
  amount: bigint
}) {
  return {
    domain: {
      name: 'Permit2',
      chainId: 1,
      verifyingContract: getAddress(PERMIT2_ADDRESS),
    },
    types: {
      PermitSingle: [
        { name: 'details', type: 'PermitDetails' },
        { name: 'spender', type: 'address' },
        { name: 'sigDeadline', type: 'uint256' },
      ],
      PermitDetails: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint160' },
        { name: 'expiration', type: 'uint48' },
        { name: 'nonce', type: 'uint48' },
      ],
    },
    values: {
      details: {
        token,
        amount,
        expiration: 2_000_000_000,
        nonce: 0,
      },
      spender,
      sigDeadline: 2_000_000_000n,
    },
  } as const
}

/** JSON-safe copy (bigint → decimal string) for embedding in a mocked API response. */
function toJsonSafe(value: unknown): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify(value, (_key, entry: unknown) => (typeof entry === 'bigint' ? entry.toString() : entry)),
  ) as Record<string, unknown>
}

/**
 * SIGN_MSG plan step carrying a Permit2 permit payload — transformed into a
 * Permit2Signature step whose proof is PATCHed back as a `signature` instead of a `txHash`.
 */
export function buildSignMsgPlanStep({
  stepIndex,
  token,
  spender,
  amount,
  status,
}: {
  stepIndex: number
  token: Address
  spender: Address
  amount: bigint
  status: TradingApi.PlanStepStatus
}): TradingApi.PlanStep {
  const { domain, types, values } = buildPermit2TypedData({ token, spender, amount })
  return {
    stepIndex,
    method: TradingApi.PlanStepMethod.SIGN_MSG,
    payloadType: TradingApi.PlanStepPayloadType.EIP_712,
    payload: { domain, types, values: toJsonSafe(values) },
    status,
    tokenIn: token,
    tokenInAmount: amount.toString(),
    tokenOut: token,
    tokenOutAmount: amount.toString(),
    tokenInChainId: TradingApi.ChainId._1,
    tokenOutChainId: TradingApi.ChainId._1,
    stepType: TradingApi.PlanStepType.APPROVAL_PERMIT,
  }
}

export type PatchBehavior =
  | { result: 'complete' }
  | { result: 'error' }
  /** Marks the step IN_PROGRESS on PATCH and only completes it after `pendingGets` subsequent GET polls. */
  | { result: 'pending'; pendingGets: number }

export type ChainedSwapPlanMockOptions = {
  /** Fresh step array for each created plan. First actionable step should be AWAITING_ACTION. */
  buildSteps: () => TradingApi.PlanStep[]
  /** Per-stepIndex override of how a submitted proof resolves. Default: complete immediately. */
  patchBehaviorByStepIndex?: Record<number, PatchBehavior>
  /** When set, POST /plan responds with this HTTP status instead of creating a plan. */
  createPlanHttpStatus?: number
}

export type ChainedSwapPlanMockRecord = {
  planCreateCount: number
  /** Every PATCH proof submission (stepIndex + full proof body), in arrival order. */
  patches: { stepIndex: number; proof?: TradingApi.PlanStepProof }[]
  getCount: number
}

type PlanState = {
  response: TradingApi.PlanResponse
  pending?: { stepIndex: number; remainingGets: number; proof?: TradingApi.PlanStepProof }
}

function buildPlanResponse({
  request,
  planId,
  steps,
}: {
  request: TradingApi.CreatePlanRequest
  planId: string
  steps: TradingApi.PlanStep[]
}): TradingApi.PlanResponse {
  const createdAt = new Date().toISOString()
  const quote = request.quote
  const swapper = requireString(quote.swapper, 'swapper')

  return {
    requestId: `chained-e2e-${planId}`,
    planId,
    swapper,
    recipient: quote.output.recipient ?? swapper,
    quoteId: quote.quoteId,
    status: TradingApi.PlanStatus.AWAITING_ACTION,
    createdAt,
    lastUserActionAt: createdAt,
    steps,
    currentStepIndex: 0,
    expectedOutput: requireString(quote.output.amount, 'output amount'),
    gasFee: '0',
    gasFeeQuote: '0',
    gasFeeUSD: '0',
    gasUseEstimate: '0',
    gasStrategies: [],
    timeEstimateMs: 1_000,
  }
}

function failStep({
  plan,
  stepIndex,
  proof,
}: {
  plan: TradingApi.PlanResponse
  stepIndex: number
  proof?: TradingApi.PlanStepProof
}): void {
  plan.steps = plan.steps.map((step) =>
    step.stepIndex === stepIndex
      ? { ...step, status: TradingApi.PlanStepStatus.STEP_ERROR, ...(proof ? { proof } : {}) }
      : step,
  )
  plan.status = TradingApi.PlanStatus.FAILED
  plan.lastUserActionAt = new Date().toISOString()
}

function markStepInProgress({
  plan,
  stepIndex,
  proof,
}: {
  plan: TradingApi.PlanResponse
  stepIndex: number
  proof?: TradingApi.PlanStepProof
}): void {
  plan.steps = plan.steps.map((step) =>
    step.stepIndex === stepIndex
      ? { ...step, status: TradingApi.PlanStepStatus.IN_PROGRESS, ...(proof ? { proof } : {}) }
      : step,
  )
  plan.status = TradingApi.PlanStatus.IN_PROGRESS
  plan.lastUserActionAt = new Date().toISOString()
}

/**
 * Emulates the stateful entry-gateway plan lifecycle (POST /plan, PATCH /plan/{id},
 * GET /plan/{id}) which cannot observe transaction hashes mined only on Anvil.
 * Returns a record of the calls it served so tests can assert step ordering and
 * validate the submitted proofs against on-chain state.
 */
export async function installChainedSwapPlanMock(
  page: Page,
  options: ChainedSwapPlanMockOptions,
): Promise<ChainedSwapPlanMockRecord> {
  const record: ChainedSwapPlanMockRecord = { planCreateCount: 0, patches: [], getCount: 0 }
  const plans = new Map<string, PlanState>()
  let planCounter = 0

  await page.route(isPlanRoute, async (route) => {
    const request = route.request()
    const path = getPlanPath(new URL(request.url()).pathname)

    if (request.method() === 'POST' && path === PLAN_PATH) {
      record.planCreateCount += 1
      if (options.createPlanHttpStatus !== undefined) {
        // Matches the real Err500 body shape/code (see Err500 in packages/api trading api.json).
        await route.fulfill({
          status: options.createPlanHttpStatus,
          contentType: 'application/json',
          body: JSON.stringify({
            errorCode: 'InternalServerError',
            detail: 'chained-e2e forced plan creation failure',
          }),
        })
        return
      }
      const planId = `chained-e2e-plan-${++planCounter}`
      const response = buildPlanResponse({
        request: request.postDataJSON() as TradingApi.CreatePlanRequest,
        planId,
        steps: options.buildSteps(),
      })
      plans.set(planId, { response })
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) })
      return
    }

    const planId = path.slice(`${PLAN_PATH}/`.length)
    const planState = plans.get(planId)
    if (!planState) {
      // Matches the real Err404 body shape/code (see Err404 in packages/api trading api.json).
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ errorCode: 'ResourceNotFound', detail: 'Plan not found' }),
      })
      return
    }
    const plan = planState.response

    if (request.method() === 'PATCH') {
      const update = request.postDataJSON() as TradingApi.UpdatePlanRequest
      const submittedStep = update.steps[0]
      record.patches.push({ stepIndex: submittedStep.stepIndex, proof: submittedStep.proof })

      const behavior = options.patchBehaviorByStepIndex?.[submittedStep.stepIndex] ?? { result: 'complete' }
      switch (behavior.result) {
        case 'error':
          failStep({ plan, stepIndex: submittedStep.stepIndex, proof: submittedStep.proof })
          break
        case 'pending':
          markStepInProgress({ plan, stepIndex: submittedStep.stepIndex, proof: submittedStep.proof })
          planState.pending = {
            stepIndex: submittedStep.stepIndex,
            remainingGets: behavior.pendingGets,
            proof: submittedStep.proof,
          }
          break
        case 'complete':
          completePlanStep({ plan, stepIndex: submittedStep.stepIndex, proof: submittedStep.proof })
          break
      }
    }

    if (request.method() === 'GET') {
      record.getCount += 1
      if (planState.pending) {
        if (planState.pending.remainingGets > 0) {
          planState.pending.remainingGets -= 1
        } else {
          completePlanStep({ plan, stepIndex: planState.pending.stepIndex, proof: planState.pending.proof })
          planState.pending = undefined
        }
      }
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(plan) })
  })

  return record
}
