import { TradingApi } from '@universe/api'
// oxlint-disable-next-line universe-custom/no-direct-viem-ethers-import -- Node-side mock must not load the feature-gated app adapter
import type { Address } from 'viem'

/**
 * Machinery shared by the entry-gateway plan-lifecycle mocks (earn.ts and plan.ts).
 * Both mocks emulate the same protocol — POST /plan, PATCH /plan/{id}, GET /plan/{id} —
 * so path handling, the SEND_TX step builder, and the step-completion status transition
 * live here to keep the two emulations from drifting apart.
 */

export const PLAN_PATH = '/plan'
export const MAX_UINT256 = 2n ** 256n - 1n

export const WETH_ABI = [
  { type: 'function', name: 'deposit', stateMutability: 'payable', inputs: [], outputs: [] },
  {
    type: 'function',
    name: 'withdraw',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'wad', type: 'uint256' }],
    outputs: [],
  },
] as const

/** Strips the optional entry-gateway `/api` prefix so plan routes match in both serving modes. */
export function getPlanPath(pathname: string): string {
  const entryGatewayPrefix = '/api'
  return pathname.startsWith(entryGatewayPrefix) ? pathname.slice(entryGatewayPrefix.length) : pathname
}

/** Route predicate matching POST /plan and /plan/{id} (with or without the `/api` prefix). */
export function isPlanRoute(url: URL): boolean {
  const path = getPlanPath(url.pathname)
  return path === PLAN_PATH || path.startsWith(`${PLAN_PATH}/`)
}

export function buildSendTxPlanStep({
  stepIndex,
  stepType,
  to,
  data,
  value,
  tokenIn,
  tokenInAmount,
  tokenOut,
  tokenOutAmount,
  status,
}: {
  stepIndex: number
  stepType: TradingApi.PlanStepType
  to: Address
  data: `0x${string}`
  value?: string
  tokenIn: string
  tokenInAmount: string
  tokenOut: string
  tokenOutAmount: string
  status: TradingApi.PlanStepStatus
}): TradingApi.PlanStep {
  return {
    stepIndex,
    method: TradingApi.PlanStepMethod.SEND_TX,
    payloadType: TradingApi.PlanStepPayloadType.TX,
    payload: {
      to,
      chainId: TradingApi.ChainId._1,
      data,
      ...(value ? { value } : {}),
    },
    status,
    tokenIn,
    tokenInAmount,
    tokenOut,
    tokenOutAmount,
    tokenInChainId: TradingApi.ChainId._1,
    tokenOutChainId: TradingApi.ChainId._1,
    stepType,
  }
}

/**
 * Marks the step (and any before it) COMPLETE, attaches the submitted proof, promotes the
 * next step to AWAITING_ACTION, and finalizes the plan status when the last step completes.
 */
export function completePlanStep({
  plan,
  stepIndex,
  proof,
}: {
  plan: TradingApi.PlanResponse
  stepIndex: number
  proof?: TradingApi.PlanStepProof
}): void {
  const isLastStep = stepIndex === plan.steps.length - 1
  plan.steps = plan.steps.map((step) => {
    if (step.stepIndex <= stepIndex) {
      return {
        ...step,
        status: TradingApi.PlanStepStatus.COMPLETE,
        ...(step.stepIndex === stepIndex && proof ? { proof } : {}),
      }
    }
    if (step.stepIndex === stepIndex + 1) {
      return { ...step, status: TradingApi.PlanStepStatus.AWAITING_ACTION }
    }
    return step
  })
  plan.currentStepIndex = Math.min(stepIndex + 1, plan.steps.length - 1)
  plan.status = isLastStep ? TradingApi.PlanStatus.COMPLETED : TradingApi.PlanStatus.AWAITING_ACTION
  plan.lastUserActionAt = new Date().toISOString()
}
