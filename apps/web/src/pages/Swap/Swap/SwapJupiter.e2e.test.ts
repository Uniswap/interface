/**
 * E2E coverage for Solana swaps via the Jupiter Ultra API (SWAP-2293).
 *
 * Solana swaps bypass the Trading API entirely: quotes come from GET /ultra/v1/order and the
 * signed transaction is submitted through POST /ultra/v1/execute on the Jupiter proxy
 * (packages/api/src/clients/jupiter). There is no Anvil equivalent for SVM and no mocked SVM
 * wallet connector, so the whole chain is made deterministic at the network/mock layer:
 * a Wallet Standard mock wallet auto-connects and signs with a marker signature
 * (playwright/solana/mockWallet), Solana RPC balance lookups are stubbed
 * (playwright/solana/mockRpc), and both Jupiter endpoints are mocked (playwright/solana/jupiter).
 */
import { USDC_SOLANA } from 'uniswap/src/constants/tokens'
import { WRAPPED_SOL_ADDRESS_SOLANA } from 'uniswap/src/features/chains/svm/defaults'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { expect, getTest, type Page } from '~/playwright/fixtures'
import { installJupiterExecuteMock, installJupiterOrderMock } from '~/playwright/solana/jupiter'
import { installSolanaRpcMock } from '~/playwright/solana/mockRpc'
import {
  getMockSolanaWalletSignCount,
  installMockSolanaWallet,
  makeMockSolanaWalletRejectSignatures,
  MOCK_SVM_SIGNATURE_BYTE,
  MOCK_SVM_WALLET_ADDRESS,
} from '~/playwright/solana/mockWallet'

const test = getTest()

const SWAP_URL = `/swap?chain=solana&outputChain=solana&inputCurrency=NATIVE&outputCurrency=${USDC_SOLANA.address}`

const SWAP_AMOUNT_SOL = '1'
const SWAP_AMOUNT_LAMPORTS = '1000000000' // 1 SOL (9 decimals)
const QUOTE_OUT_AMOUNT_RAW = '150000000' // 150 USDC (6 decimals)
const QUOTE_OUT_AMOUNT_DISPLAY = '150'
const SOL_BALANCE_LAMPORTS = 10_000_000_000n // 10 SOL

async function fillSwapAmount(page: Page): Promise<void> {
  await page.goto(SWAP_URL)
  await expect(page.getByTestId(TestID.ChooseInputToken + '-label')).toHaveText('SOL')
  await expect(page.getByTestId(TestID.ChooseOutputToken + '-label')).toHaveText('USDC')
  await page.getByTestId(TestID.AmountInputIn).click()
  await page.getByTestId(TestID.AmountInputIn).fill(SWAP_AMOUNT_SOL)
}

async function reviewAndSubmitSwap(page: Page): Promise<void> {
  await expect(page.getByTestId(TestID.ReviewSwap)).toBeEnabled()
  await page.getByTestId(TestID.ReviewSwap).click()
  await page.getByTestId(TestID.Swap).click()
}

test.describe(
  'Solana swap (Jupiter flow)',
  {
    tag: '@team:apps-swap',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-swap' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test.beforeEach(async ({ page }) => {
      await installMockSolanaWallet(page)
      await installSolanaRpcMock(page, {
        ownerAddress: MOCK_SVM_WALLET_ADDRESS,
        solBalanceLamports: SOL_BALANCE_LAMPORTS,
        splBalancesByMint: { [USDC_SOLANA.address]: { amount: '0', decimals: USDC_SOLANA.decimals } },
      })
    })

    test('completes a SOL to USDC swap through the mocked Jupiter execute endpoint', async ({ page }) => {
      const orderRecord = await installJupiterOrderMock(page, { outAmount: QUOTE_OUT_AMOUNT_RAW })
      const executeRecord = await installJupiterExecuteMock(page, { result: 'success' })

      await fillSwapAmount(page)
      await expect(page.getByTestId(TestID.AmountInputOut)).toHaveValue(QUOTE_OUT_AMOUNT_DISPLAY)
      await reviewAndSubmitSwap(page)

      // Success is user-visible
      const toast = page.getByTestId(TestID.ActivityPopup)
      await expect(toast.getByText('Swapped')).toBeVisible({ timeout: 30_000 })

      // Exactly one execution, tied to an order this mock actually served. Polling keeps
      // serving newer quotes through review/submission, so assert membership, not recency.
      expect(executeRecord.requests).toHaveLength(1)
      expect(orderRecord.requestIds).toContain(executeRecord.requests[0].requestId)

      // The submitted transaction really went through the wallet: the wallet signed exactly
      // once, and the executed payload carries the wallet's marker signature in the v0
      // signature slot — forwarding the unsigned order transaction would fail here.
      expect(await getMockSolanaWalletSignCount(page)).toEqual(1)
      const executedTransaction = Buffer.from(executeRecord.requests[0].signedTransaction, 'base64')
      expect(executedTransaction[0]).toEqual(1) // compact-u16 signature count
      const signatureSlot = executedTransaction.subarray(1, 65)
      expect(signatureSlot.length).toEqual(64)
      expect(signatureSlot.every((byte) => byte === MOCK_SVM_SIGNATURE_BYTE)).toBe(true)
    })

    test('displays the mocked quote and requests the order with the expected params', async ({ page }) => {
      const orderRecord = await installJupiterOrderMock(page, { outAmount: QUOTE_OUT_AMOUNT_RAW })
      // Quote-only test: the execute mock exists solely to prove no execution is triggered.
      const executeRecord = await installJupiterExecuteMock(page, { result: 'success' })

      await fillSwapAmount(page)

      // Quote parsing/display: the output field reflects the mocked order's outAmount
      await expect(page.getByTestId(TestID.AmountInputOut)).toHaveValue(QUOTE_OUT_AMOUNT_DISPLAY)
      await expect(page.getByTestId(TestID.ReviewSwap)).toBeEnabled()

      // Request regression guard: the order carries the expected mints, raw amount, mode and taker
      await expect
        .poll(() => orderRecord.requests.at(-1)?.taker, { message: 'order request with connected taker' })
        .toEqual(MOCK_SVM_WALLET_ADDRESS)
      const lastRequest = orderRecord.requests.at(-1)
      expect(lastRequest).toMatchObject({
        inputMint: WRAPPED_SOL_ADDRESS_SOLANA,
        outputMint: USDC_SOLANA.address,
        amount: SWAP_AMOUNT_LAMPORTS,
        swapMode: 'ExactIn',
        taker: MOCK_SVM_WALLET_ADDRESS,
      })

      // Quoting alone never triggers an execution
      expect(executeRecord.requests).toHaveLength(0)
    })

    test('recovers without executing when the user rejects the wallet signature', async ({ page }) => {
      await installJupiterOrderMock(page, { outAmount: QUOTE_OUT_AMOUNT_RAW })
      const executeRecord = await installJupiterExecuteMock(page, { result: 'success' })
      await makeMockSolanaWalletRejectSignatures(page)

      await fillSwapAmount(page)
      await reviewAndSubmitSwap(page)

      // The wallet was asked to sign and refused
      await expect.poll(() => getMockSolanaWalletSignCount(page), { message: 'wallet sign attempt' }).toEqual(1)

      // A rejection is handled gracefully: no execution, no success, no error dialog
      expect(executeRecord.requests).toHaveLength(0)
      await expect(page.getByTestId(TestID.ActivityPopup).getByText('Swapped')).not.toBeVisible()
      await expect(page.getByText('Swap failed')).not.toBeVisible()

      // The form recovers: back out of review and the swap can be re-attempted
      await page.keyboard.press('Escape')
      await page.getByTestId(TestID.AmountInputIn).click()
      await page.getByTestId(TestID.AmountInputIn).fill('2')
      await expect(page.getByTestId(TestID.AmountInputOut)).toHaveValue(QUOTE_OUT_AMOUNT_DISPLAY)
      await expect(page.getByTestId(TestID.ReviewSwap)).toBeEnabled()

      // Still no execution after recovery
      expect(executeRecord.requests).toHaveLength(0)
    })

    test('disables review with an insufficient-balance warning when the SOL balance is too low', async ({ page }) => {
      // Override the default 10 SOL balance with less than the 1 SOL swap amount.
      // Playwright routes match newest-first, so this wins over the beforeEach mock.
      await installSolanaRpcMock(page, {
        ownerAddress: MOCK_SVM_WALLET_ADDRESS,
        solBalanceLamports: 500_000_000n, // 0.5 SOL
        splBalancesByMint: { [USDC_SOLANA.address]: { amount: '0', decimals: USDC_SOLANA.decimals } },
      })
      await installJupiterOrderMock(page, { outAmount: QUOTE_OUT_AMOUNT_RAW })
      const executeRecord = await installJupiterExecuteMock(page, { result: 'success' })

      await fillSwapAmount(page)

      // A quote still displays, but the insufficient balance disables review
      await expect(page.getByTestId(TestID.AmountInputOut)).toHaveValue(QUOTE_OUT_AMOUNT_DISPLAY)
      await expect(page.getByTestId(TestID.ReviewSwap)).toBeDisabled()
      await expect(page.getByText('Not enough SOL')).toBeVisible()

      // An unfundable swap never reaches execution
      expect(executeRecord.requests).toHaveLength(0)
    })

    test('shows a swap failure when Jupiter execute reports the transaction failed', async ({ page }) => {
      await installJupiterOrderMock(page, { outAmount: QUOTE_OUT_AMOUNT_RAW })
      const executeRecord = await installJupiterExecuteMock(page, {
        result: 'failed',
        code: -1000,
        error: 'Transaction failed to land',
      })

      await fillSwapAmount(page)
      await reviewAndSubmitSwap(page)

      // The Jupiter execute error surfaces its specific failure content
      await expect(page.getByText('Swap failed')).toBeVisible({ timeout: 30_000 })
      await expect(page.getByText('Something went wrong with Jupiter API', { exact: false })).toBeVisible()

      // Never shows success
      await expect(page.getByTestId(TestID.ActivityPopup).getByText('Swapped')).not.toBeVisible()
      expect(executeRecord.requests).toHaveLength(1)
    })

    test('disables review when the order request fails and recovers once quotes return', async ({ page }) => {
      const orderRecord = await installJupiterOrderMock(page, { outAmount: QUOTE_OUT_AMOUNT_RAW })
      const executeRecord = await installJupiterExecuteMock(page, { result: 'success' })
      orderRecord.failWithHttpStatus = 500

      await fillSwapAmount(page)

      // No quote: output stays empty and review stays disabled
      await expect.poll(() => orderRecord.requests.length, { message: 'order request attempted' }).toBeGreaterThan(0)
      await expect(page.getByTestId(TestID.AmountInputOut)).toHaveValue('')
      await expect(page.getByTestId(TestID.ReviewSwap)).toBeDisabled()

      // The form stays usable: once the API recovers, editing the amount re-quotes successfully
      orderRecord.failWithHttpStatus = undefined
      await page.getByTestId(TestID.AmountInputIn).fill('2')
      await expect(page.getByTestId(TestID.AmountInputOut)).toHaveValue(QUOTE_OUT_AMOUNT_DISPLAY)
      await expect(page.getByTestId(TestID.ReviewSwap)).toBeEnabled()

      // A failed quote never triggers an execution
      expect(executeRecord.requests).toHaveLength(0)
    })

    test('shows the swapped amounts in the completed activity popup', async ({ page }) => {
      await installJupiterOrderMock(page, { outAmount: QUOTE_OUT_AMOUNT_RAW })
      await installJupiterExecuteMock(page, { result: 'success' })

      await fillSwapAmount(page)
      await reviewAndSubmitSwap(page)

      // The completed activity entry reflects the mocked order's exact amounts
      const toast = page.getByTestId(TestID.ActivityPopup)
      await expect(toast.getByText('Swapped')).toBeVisible({ timeout: 30_000 })
      await expect(toast.getByText(/1\.00 SOL/)).toBeVisible()
      await expect(toast.getByText(/150\.00 USDC/)).toBeVisible()
    })
  },
)
