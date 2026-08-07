/**
 * E2E coverage for chained-action swaps ("plans", SWAP-2293).
 *
 * A quote with routing CHAINED sends the swap through the plan saga instead of the classic
 * swap saga: POST /plan creates the step list, each executed step's proof is PATCHed back,
 * and GET /plan/{id} is polled until the step finalizes. The hosted services cannot observe
 * Anvil-only transaction hashes, so the quote and the full plan lifecycle are mocked
 * (see playwright/anvil/plan.ts) while every step's calldata still executes for real
 * against the mainnet fork — balances and allowances are asserted on-chain.
 *
 * Step methods covered: SEND_TX (approval + swap) and SIGN_MSG (Permit2 signature).
 * SEND_CALLS (batched smart-wallet calls) is deliberately out of scope here — it requires
 * a 5792-capable wallet stub and is tracked by the smart-wallet e2e suites.
 */
import { MaxUint256, PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { UNIVERSAL_ROUTER_ADDRESS, UniversalRouterVersion, WETH_ADDRESS } from '@uniswap/universal-router-sdk'
import { TradingApi } from '@universe/api'
import { FeatureFlags } from '@universe/gating'
import { USDC, USDT } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { parseEther, parseUnits, recoverTypedDataAddress } from 'viem'
import { assume0xAddress } from '~/chains'
import {
  buildPermit2TypedData,
  buildSendTxPlanStep,
  buildSignMsgPlanStep,
  encodeApproveCalldata,
  encodeTransferCalldata,
  encodeWethDepositCalldata,
  installChainedSwapPlanMock,
  installChainedSwapQuoteMock,
} from '~/playwright/anvil/plan'
import { ONE_MILLION_USDT } from '~/playwright/anvil/utils'
import { expect, getTest, type Page } from '~/playwright/fixtures'
import { createTestUrlBuilder } from '~/playwright/fixtures/urls'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'

const test = getTest({ withAnvil: true })

const buildSwapUrl = createTestUrlBuilder({
  basePath: '/swap',
  defaultFeatureFlags: {
    [FeatureFlags.ChainedActions]: true,
    [FeatureFlags.DisableSessionsForPlan]: true,
  },
})
const SWAP_URL = buildSwapUrl({
  queryParams: { inputCurrency: USDT.address, outputCurrency: USDC.address },
})

const SWAP_AMOUNT = '10'
const SWAP_AMOUNT_RAW = parseUnits(SWAP_AMOUNT, 6)
const USDT_ADDRESS = assume0xAddress(USDT.address)
const WETH = assume0xAddress(WETH_ADDRESS(1))
const UNIVERSAL_ROUTER = assume0xAddress(UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V2_0, UniverseChainId.Mainnet))
// Inert recipient for the mocked swap-step calldata; only the observable transfer matters.
const SINK_ADDRESS = '0x000000000000000000000000000000000000dEaD'

const ERC20_APPROVE_SELECTOR = '0x095ea7b3'
const ERC20_TRANSFER_SELECTOR = '0xa9059cbb'
const TX_HASH_REGEX = /^0x[0-9a-f]{64}$/
const SIGNATURE_REGEX = /^0x[0-9a-f]{130}$/

function approvalStep(stepIndex: number, status: TradingApi.PlanStepStatus): TradingApi.PlanStep {
  return buildSendTxPlanStep({
    stepIndex,
    stepType: TradingApi.PlanStepType.APPROVAL_TXN,
    to: USDT_ADDRESS,
    data: encodeApproveCalldata({ spender: assume0xAddress(PERMIT2_ADDRESS) }),
    tokenIn: USDT.address,
    tokenInAmount: SWAP_AMOUNT_RAW.toString(),
    tokenOut: USDT.address,
    tokenOutAmount: SWAP_AMOUNT_RAW.toString(),
    status,
  })
}

/** Permit2 signature step (SIGN_MSG) — its proof is a signature, not a txHash. */
function permitSignatureStep(stepIndex: number, status: TradingApi.PlanStepStatus): TradingApi.PlanStep {
  return buildSignMsgPlanStep({
    stepIndex,
    token: USDT_ADDRESS,
    spender: UNIVERSAL_ROUTER,
    amount: SWAP_AMOUNT_RAW,
    status,
  })
}

/** "Swap" step whose calldata verifiably spends the input token on the fork. */
function transferSwapStep(stepIndex: number, status: TradingApi.PlanStepStatus): TradingApi.PlanStep {
  return buildSendTxPlanStep({
    stepIndex,
    stepType: TradingApi.PlanStepType.CLASSIC,
    to: USDT_ADDRESS,
    data: encodeTransferCalldata({ recipient: SINK_ADDRESS, amount: SWAP_AMOUNT_RAW }),
    tokenIn: USDT.address,
    tokenInAmount: SWAP_AMOUNT_RAW.toString(),
    tokenOut: USDC.address,
    tokenOutAmount: SWAP_AMOUNT_RAW.toString(),
    status,
  })
}

/**
 * "Swap" step the wallet cannot submit: a WETH deposit whose value exceeds the wallet
 * balance, so eth_sendTransaction (and gas estimation) rejects with insufficient funds.
 * A merely *reverting* transaction is not a client-side failure — the wallet submits it
 * and the Trading API reports the revert as STEP_ERROR (covered separately below).
 */
function unsubmittableSwapStep(stepIndex: number, status: TradingApi.PlanStepStatus): TradingApi.PlanStep {
  return buildSendTxPlanStep({
    stepIndex,
    stepType: TradingApi.PlanStepType.CLASSIC,
    to: WETH,
    data: encodeWethDepositCalldata(),
    value: parseEther('1000000').toString(),
    tokenIn: USDT.address,
    tokenInAmount: SWAP_AMOUNT_RAW.toString(),
    tokenOut: USDC.address,
    tokenOutAmount: SWAP_AMOUNT_RAW.toString(),
    status,
  })
}

/** Case-insensitive EVM address equality through the shared normalizer. */
function expectSameAddress(actual: string | null | undefined, expected: string): void {
  expect(
    areAddressesEqual({
      addressInput1: { address: actual, chainId: UniverseChainId.Mainnet },
      addressInput2: { address: expected, chainId: UniverseChainId.Mainnet },
    }),
    `expected address ${String(actual)} to equal ${expected}`,
  ).toBe(true)
}

/** Asserts the proof carries a well-formed transaction hash and returns it typed. */
function requireProofTxHash(patch: { proof?: TradingApi.PlanStepProof } | undefined): `0x${string}` {
  expect(patch?.proof?.txHash).toMatch(TX_HASH_REGEX)
  return patch?.proof?.txHash as `0x${string}`
}

async function fillSwapAmountAndReview(page: Page): Promise<void> {
  await page.goto(SWAP_URL)
  await page.getByTestId(TestID.AmountInputIn).click()
  await page.getByTestId(TestID.AmountInputIn).fill(SWAP_AMOUNT)
  await expect(page.getByTestId(TestID.ReviewSwap)).toBeEnabled()
  await page.getByTestId(TestID.ReviewSwap).click()
}

async function submitSwap(page: Page): Promise<void> {
  await page.getByTestId(TestID.Swap).click()
}

test.describe(
  'Chained-action swap (plan flow)',
  {
    tag: '@team:apps-swap',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-swap' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test.beforeEach(async ({ anvil }) => {
      await anvil.setErc20Balance({ address: USDT_ADDRESS, balance: ONE_MILLION_USDT })
    })

    test('completes a multi-step plan and reports each step proof against its mined transaction', async ({
      page,
      anvil,
    }) => {
      await installChainedSwapQuoteMock(page)
      const record = await installChainedSwapPlanMock(page, {
        buildSteps: () => [
          approvalStep(0, TradingApi.PlanStepStatus.AWAITING_ACTION),
          transferSwapStep(1, TradingApi.PlanStepStatus.NOT_READY),
        ],
      })
      const balanceBefore = await anvil.getErc20Balance(USDT_ADDRESS, TEST_WALLET_ADDRESS)

      await fillSwapAmountAndReview(page)
      await submitSwap(page)

      // Success is user-visible
      const toast = page.getByTestId(TestID.ActivityPopup)
      await expect(toast.getByText('Swapped')).toBeVisible({ timeout: 60_000 })

      // Both plan steps really executed on-chain, in order
      const allowance = await anvil.getErc20Allowance({
        address: USDT_ADDRESS,
        owner: TEST_WALLET_ADDRESS,
        spender: assume0xAddress(PERMIT2_ADDRESS),
      })
      expect(allowance).toEqual(MaxUint256.toBigInt())
      const balanceAfter = await anvil.getErc20Balance(USDT_ADDRESS, TEST_WALLET_ADDRESS)
      expect(balanceBefore - balanceAfter).toEqual(SWAP_AMOUNT_RAW)

      // Proofs were submitted sequentially per step...
      expect(record.patches.map((patch) => patch.stepIndex)).toEqual([0, 1])

      // ...and each proof's txHash resolves to a distinct transaction actually mined on the
      // fork, targeting the step's contract with the step's calldata — a wrong, stale, or
      // fabricated proof would fail here even though the on-chain balance checks pass.
      const approvalTxHash = requireProofTxHash(record.patches[0])
      const swapTxHash = requireProofTxHash(record.patches[1])
      expect(approvalTxHash).not.toEqual(swapTxHash)

      const approvalTx = await anvil.getTransaction({ hash: approvalTxHash })
      expectSameAddress(approvalTx.to, USDT_ADDRESS)
      expect(approvalTx.input.startsWith(ERC20_APPROVE_SELECTOR)).toBe(true)

      const swapTx = await anvil.getTransaction({ hash: swapTxHash })
      expectSameAddress(swapTx.to, USDT_ADDRESS)
      expect(swapTx.input.startsWith(ERC20_TRANSFER_SELECTOR)).toBe(true)

      const approvalReceipt = await anvil.getTransactionReceipt({ hash: approvalTxHash })
      const swapReceipt = await anvil.getTransactionReceipt({ hash: swapTxHash })
      expect(approvalReceipt.status).toEqual('success')
      expect(swapReceipt.status).toEqual('success')
    })

    test('submits a signature proof for a SIGN_MSG permit step', async ({ page, anvil }) => {
      await installChainedSwapQuoteMock(page)
      const record = await installChainedSwapPlanMock(page, {
        buildSteps: () => [
          approvalStep(0, TradingApi.PlanStepStatus.AWAITING_ACTION),
          permitSignatureStep(1, TradingApi.PlanStepStatus.NOT_READY),
          transferSwapStep(2, TradingApi.PlanStepStatus.NOT_READY),
        ],
      })
      const balanceBefore = await anvil.getErc20Balance(USDT_ADDRESS, TEST_WALLET_ADDRESS)

      await fillSwapAmountAndReview(page)
      await submitSwap(page)

      const toast = page.getByTestId(TestID.ActivityPopup)
      await expect(toast.getByText('Swapped')).toBeVisible({ timeout: 60_000 })

      // All three steps PATCHed a proof, in order
      expect(record.patches.map((patch) => patch.stepIndex)).toEqual([0, 1, 2])

      // The SIGN_MSG step's proof carries a signature instead of a transaction hash...
      const permitPatch = record.patches.at(1)
      expect(permitPatch?.proof?.txHash).toBeUndefined()
      expect(permitPatch?.proof?.signature).toMatch(SIGNATURE_REGEX)

      // ...and it is a real EIP-712 signature of the step's permit payload by the test wallet.
      const typedData = buildPermit2TypedData({
        token: USDT_ADDRESS,
        spender: UNIVERSAL_ROUTER,
        amount: SWAP_AMOUNT_RAW,
      })
      const signerAddress = await recoverTypedDataAddress({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: 'PermitSingle',
        message: typedData.values,
        signature: permitPatch?.proof?.signature as `0x${string}`,
      })
      expectSameAddress(signerAddress, TEST_WALLET_ADDRESS)

      // The surrounding SEND_TX steps still executed on-chain
      const balanceAfter = await anvil.getErc20Balance(USDT_ADDRESS, TEST_WALLET_ADDRESS)
      expect(balanceBefore - balanceAfter).toEqual(SWAP_AMOUNT_RAW)
    })

    test('surfaces a pending step via GET polling before completing', async ({ page, anvil }) => {
      await installChainedSwapQuoteMock(page)
      const record = await installChainedSwapPlanMock(page, {
        buildSteps: () => [
          approvalStep(0, TradingApi.PlanStepStatus.AWAITING_ACTION),
          transferSwapStep(1, TradingApi.PlanStepStatus.NOT_READY),
        ],
        // Step 0 stays IN_PROGRESS on PATCH and only completes after two GET polls
        patchBehaviorByStepIndex: { 0: { result: 'pending', pendingGets: 2 } },
      })
      const balanceBefore = await anvil.getErc20Balance(USDT_ADDRESS, TEST_WALLET_ADDRESS)

      await fillSwapAmountAndReview(page)
      await submitSwap(page)

      const toast = page.getByTestId(TestID.ActivityPopup)
      await expect(toast.getByText('Swapped')).toBeVisible({ timeout: 60_000 })

      // The pending state forced the client through the GET /plan/{id} polling loop
      expect(record.getCount).toBeGreaterThanOrEqual(2)
      expect(record.patches.map((patch) => patch.stepIndex)).toEqual([0, 1])
      const balanceAfter = await anvil.getErc20Balance(USDT_ADDRESS, TEST_WALLET_ADDRESS)
      expect(balanceBefore - balanceAfter).toEqual(SWAP_AMOUNT_RAW)
    })

    test('shows a swap failure when the wallet cannot submit a plan step', async ({ page }) => {
      await installChainedSwapQuoteMock(page)
      const record = await installChainedSwapPlanMock(page, {
        buildSteps: () => [unsubmittableSwapStep(0, TradingApi.PlanStepStatus.AWAITING_ACTION)],
      })

      await fillSwapAmountAndReview(page)
      await submitSwap(page)

      // The failed step surfaces the plan-specific swap failure message
      await expect(page.getByText('Something went wrong while submitting your swap')).toBeVisible({
        timeout: 60_000,
      })

      // Never shows success and never submits a proof for the failed step
      await expect(page.getByTestId(TestID.ActivityPopup).getByText('Swapped')).not.toBeVisible()
      expect(record.patches).toEqual([])
    })

    test('stops execution and shows an error when the API marks a step failed', async ({ page }) => {
      await installChainedSwapQuoteMock(page)
      const record = await installChainedSwapPlanMock(page, {
        buildSteps: () => [
          approvalStep(0, TradingApi.PlanStepStatus.AWAITING_ACTION),
          transferSwapStep(1, TradingApi.PlanStepStatus.NOT_READY),
        ],
        patchBehaviorByStepIndex: { 0: { result: 'error' } },
      })

      await fillSwapAmountAndReview(page)
      await submitSwap(page)

      // The approval step's failure is user-visible and the plan halts
      await expect(page.getByText('Token approval failed')).toBeVisible({ timeout: 60_000 })
      await expect(page.getByTestId(TestID.ActivityPopup).getByText('Swapped')).not.toBeVisible()

      // Execution stopped after the failed step — no proof for step 1
      expect(record.patches.map((patch) => patch.stepIndex)).toEqual([0])
    })

    test('shows an error and keeps the form usable when plan creation fails', async ({ page }) => {
      await installChainedSwapQuoteMock(page)
      const record = await installChainedSwapPlanMock(page, {
        buildSteps: () => [transferSwapStep(0, TradingApi.PlanStepStatus.AWAITING_ACTION)],
        createPlanHttpStatus: 500,
      })

      await fillSwapAmountAndReview(page)
      await submitSwap(page)

      // Plan creation failure surfaces an error instead of success
      await expect(page.getByText('Swap failed')).toBeVisible({ timeout: 60_000 })
      await expect(page.getByTestId(TestID.ActivityPopup).getByText('Swapped')).not.toBeVisible()
      expect(record.planCreateCount).toBeGreaterThanOrEqual(1)
      expect(record.patches).toEqual([])

      // The form recovers: dismiss the error screen, edit the amount, and re-review
      await page.keyboard.press('Escape')
      await expect(page.getByText('Swap failed')).not.toBeVisible()
      await page.getByTestId(TestID.AmountInputIn).click()
      await page.getByTestId(TestID.AmountInputIn).fill('5')
      await expect(page.getByTestId(TestID.ReviewSwap)).toBeEnabled()
    })
  },
)
