// oxlint-disable-next-line no-restricted-imports -- Anvil route helpers need Playwright's Page type
import type { Page } from '@playwright/test'
import { TradingApi } from '@universe/api'
// oxlint-disable-next-line universe-custom/no-direct-viem-ethers-import -- Node-side mock must not load the feature-gated app adapter
import { encodeFunctionData, erc20Abi, type Address } from 'viem'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'
import { assume0xAddress } from '~/utils/wagmi'

const ERC4626_ABI = [
  {
    type: 'function',
    name: 'deposit',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'withdraw',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'owner', type: 'address' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
] as const
const WETH_ABI = [
  { type: 'function', name: 'deposit', stateMutability: 'payable', inputs: [], outputs: [] },
  {
    type: 'function',
    name: 'withdraw',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'wad', type: 'uint256' }],
    outputs: [],
  },
] as const
const MAX_UINT256 = 2n ** 256n - 1n
const PLAN_PATH = '/plan'

type EarnPlanMockOptions = {
  isNativeDeposit: boolean
}

type EarnQuoteMockOptions = EarnPlanMockOptions & {
  underlyingAddress: Address
}

/**
 * Returns a deterministic chained Earn quote while preserving the vault selected from ListEarnVaults.
 * The hosted quote service cannot simulate the fork-only wallet balance, so it reports no route even
 * though the same calldata succeeds on Anvil.
 */
export async function installEarnQuoteMock(page: Page, options: EarnQuoteMockOptions): Promise<void> {
  let quoteCounter = 0

  await page.route(
    (url: URL): boolean => url.pathname === '/quote',
    async (route) => {
      const request = route.request().postDataJSON() as TradingApi.QuoteRequest
      const amount = requireString(request.amount, 'quote amount')
      const tokenIn = assume0xAddress(request.tokenIn)
      const tokenOut = assume0xAddress(request.tokenOut)
      const swapper = assume0xAddress(request.swapper)
      const recipient = assume0xAddress(request.recipient)
      const requestEarnIntent = request.earnIntent
      if (!requestEarnIntent) {
        throw new Error('Earn quote mock received a request without an Earn intent')
      }
      const vault = assume0xAddress(requestEarnIntent.vault)
      const isDeposit = requestEarnIntent.action === TradingApi.EarnAction.DEPOSIT
      const quoteId = `earn-e2e-quote-${++quoteCounter}`
      const earnPreview = isDeposit
        ? {
            type: TradingApi.EarnDepositPreview.type.DEPOSIT,
            depositAssets: [{ token: options.underlyingAddress, chainId: TradingApi.ChainId._1, amount }],
            estimatedSharesOut: amount,
          }
        : {
            type: TradingApi.EarnExactAssetsWithdrawPreview.type.EXACT_ASSETS_WITHDRAW,
            requestedAssetsOut: amount,
            estimatedSharesIn: amount,
          }
      const inputToken = isDeposit ? tokenIn : vault
      const outputToken = isDeposit ? vault : tokenOut
      const earnIntent = {
        ...requestEarnIntent,
        underlyingAsset: options.underlyingAddress,
        ...(isDeposit ? {} : { requestedAssets: amount }),
      }
      const response: TradingApi.QuoteResponse = {
        requestId: `earn-e2e-${quoteId}`,
        routing: TradingApi.Routing.CHAINED,
        permitData: null,
        isTokenApprovalApplicable: isDeposit && !options.isNativeDeposit,
        quote: {
          swapper,
          input: { token: inputToken, amount },
          output: { token: outputToken, amount, recipient },
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
              stepType: isDeposit ? TradingApi.PlanStepType.VAULT_DEPOSIT : TradingApi.PlanStepType.VAULT_WITHDRAW,
              tokenIn: inputToken,
              tokenInChainId: TradingApi.ChainId._1,
              tokenOut: outputToken,
              tokenOutChainId: TradingApi.ChainId._1,
            },
          ],
          earnIntent,
          earnPreview,
        },
      }

      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) })
    },
  )
}

function getPlanPath(pathname: string): string {
  const entryGatewayPrefix = '/api'
  return pathname.startsWith(entryGatewayPrefix) ? pathname.slice(entryGatewayPrefix.length) : pathname
}

function buildTransactionStep({
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
  tokenIn: Address
  tokenInAmount: string
  tokenOut: Address
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

function getDepositAmount(quote: TradingApi.ChainedQuote): string {
  const depositAsset =
    quote.earnPreview?.type === TradingApi.EarnDepositPreview.type.DEPOSIT
      ? quote.earnPreview.depositAssets[0]
      : undefined
  return requireString(depositAsset?.amount ?? quote.input.amount, 'deposit amount')
}

function requireString(value: string | undefined, label: string): string {
  if (!value) {
    throw new Error(`Earn plan mock received a quote without ${label}`)
  }
  return value
}

function buildPlan({
  request,
  planId,
  isNativeDeposit,
}: EarnPlanMockOptions & {
  request: TradingApi.CreatePlanRequest
  planId: string
}): TradingApi.PlanResponse {
  const createdAt = new Date().toISOString()
  const quote = request.quote
  const earnIntent = quote.earnIntent
  if (!earnIntent) {
    throw new Error('Earn plan mock received a plan without an Earn intent')
  }

  const vault = assume0xAddress(earnIntent.vault)
  const underlyingAddress = assume0xAddress(earnIntent.underlyingAsset)
  const quoteInputToken = assume0xAddress(requireString(quote.input.token, 'input token'))
  const quoteOutputToken = assume0xAddress(requireString(quote.output.token, 'output token'))
  const quoteInputAmount = requireString(quote.input.amount, 'input amount')
  const quoteOutputAmount = requireString(quote.output.amount, 'output amount')
  const isDeposit = earnIntent.action === TradingApi.EarnAction.DEPOSIT
  const amount = isDeposit
    ? getDepositAmount(quote)
    : requireString(earnIntent.requestedAssets ?? quoteOutputAmount, 'withdraw amount')
  const steps: TradingApi.PlanStep[] = []

  if (isDeposit) {
    if (isNativeDeposit) {
      steps.push(
        buildTransactionStep({
          stepIndex: steps.length,
          stepType: TradingApi.PlanStepType.WRAP,
          to: underlyingAddress,
          data: encodeFunctionData({ abi: WETH_ABI, functionName: 'deposit' }),
          value: amount,
          tokenIn: quoteInputToken,
          tokenInAmount: amount,
          tokenOut: underlyingAddress,
          tokenOutAmount: amount,
          status: TradingApi.PlanStepStatus.AWAITING_ACTION,
        }),
      )
    }

    steps.push(
      buildTransactionStep({
        stepIndex: steps.length,
        stepType: TradingApi.PlanStepType.APPROVAL_TXN,
        to: underlyingAddress,
        data: encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [vault, MAX_UINT256] }),
        tokenIn: underlyingAddress,
        tokenInAmount: amount,
        tokenOut: underlyingAddress,
        tokenOutAmount: amount,
        status: steps.length === 0 ? TradingApi.PlanStepStatus.AWAITING_ACTION : TradingApi.PlanStepStatus.NOT_READY,
      }),
    )
    steps.push(
      buildTransactionStep({
        stepIndex: steps.length,
        stepType: TradingApi.PlanStepType.VAULT_DEPOSIT,
        to: vault,
        data: encodeFunctionData({
          abi: ERC4626_ABI,
          functionName: 'deposit',
          args: [BigInt(amount), TEST_WALLET_ADDRESS],
        }),
        tokenIn: underlyingAddress,
        tokenInAmount: amount,
        tokenOut: vault,
        tokenOutAmount: quoteOutputAmount,
        status: TradingApi.PlanStepStatus.NOT_READY,
      }),
    )
  } else {
    steps.push(
      buildTransactionStep({
        stepIndex: 0,
        stepType: TradingApi.PlanStepType.VAULT_WITHDRAW,
        to: vault,
        data: encodeFunctionData({
          abi: ERC4626_ABI,
          functionName: 'withdraw',
          args: [BigInt(amount), TEST_WALLET_ADDRESS, TEST_WALLET_ADDRESS],
        }),
        tokenIn: vault,
        tokenInAmount: quoteInputAmount,
        tokenOut: underlyingAddress,
        tokenOutAmount: amount,
        status: TradingApi.PlanStepStatus.AWAITING_ACTION,
      }),
    )
    if (isNativeDeposit) {
      steps.push(
        buildTransactionStep({
          stepIndex: 1,
          stepType: TradingApi.PlanStepType.UNWRAP,
          to: underlyingAddress,
          data: encodeFunctionData({ abi: WETH_ABI, functionName: 'withdraw', args: [BigInt(amount)] }),
          tokenIn: underlyingAddress,
          tokenInAmount: amount,
          tokenOut: quoteOutputToken,
          tokenOutAmount: amount,
          status: TradingApi.PlanStepStatus.NOT_READY,
        }),
      )
    }
  }

  return {
    requestId: `earn-e2e-${planId}`,
    planId,
    swapper: quote.swapper,
    recipient: quote.output.recipient ?? quote.swapper,
    quoteId: quote.quoteId,
    status: TradingApi.PlanStatus.AWAITING_ACTION,
    createdAt,
    lastUserActionAt: createdAt,
    steps,
    currentStepIndex: 0,
    expectedOutput: quoteOutputAmount,
    gasFee: '0',
    gasFeeQuote: '0',
    gasFeeUSD: '0',
    gasUseEstimate: '0',
    gasStrategies: [],
    timeEstimateMs: 1_000,
    earnIntent: {
      ...earnIntent,
      preview: quote.earnPreview,
    },
  }
}

function advancePlan({
  plan,
  stepIndex,
  proof,
}: {
  plan: TradingApi.PlanResponse
  stepIndex: number
  proof?: TradingApi.PlanStepProof
}): void {
  const isComplete = stepIndex === plan.steps.length - 1
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
  plan.status = isComplete ? TradingApi.PlanStatus.COMPLETED : TradingApi.PlanStatus.AWAITING_ACTION
  plan.lastUserActionAt = new Date().toISOString()
}

/**
 * Keeps the stateless hosted quote in the test while emulating the plan lifecycle that cannot
 * observe transaction hashes mined only on Anvil. The returned calldata calls the vault address
 * selected from ListEarnVaults, so vault rotations do not require a frontend fixture update.
 */
export async function installEarnPlanMock(page: Page, options: EarnPlanMockOptions): Promise<void> {
  const plans = new Map<string, TradingApi.PlanResponse>()
  let planCounter = 0

  await page.route(
    (url: URL): boolean => {
      const path = getPlanPath(url.pathname)
      return path === PLAN_PATH || path.startsWith(`${PLAN_PATH}/`)
    },
    async (route) => {
      const request = route.request()
      const path = getPlanPath(new URL(request.url()).pathname)

      if (request.method() === 'POST' && path === PLAN_PATH) {
        const planId = `earn-e2e-${++planCounter}`
        const plan = buildPlan({
          request: request.postDataJSON() as TradingApi.CreatePlanRequest,
          planId,
          ...options,
        })
        plans.set(planId, plan)
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(plan) })
        return
      }

      const planId = path.slice(`${PLAN_PATH}/`.length)
      const plan = plans.get(planId)
      if (!plan) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Plan not found' }),
        })
        return
      }

      if (request.method() === 'PATCH') {
        const update = request.postDataJSON() as TradingApi.UpdatePlanRequest
        const submittedStep = update.steps[0]
        advancePlan({ plan, stepIndex: submittedStep.stepIndex, proof: submittedStep.proof })
      }

      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(plan) })
    },
  )
}
