import { V1_TRADING_API_PATHS } from '@universe/api'
import { normalizeTokenAddressForCache } from '@universe/chains'
import { TestID } from '@universe/test'
import { USDC } from 'uniswap/src/constants/tokens'
import { assume0xAddress } from '~/chains'
import { expect, getTest, type Page } from '~/playwright/fixtures'
import type { AnvilClient } from '~/playwright/fixtures/anvil'
import { EMBEDDED_WALLET_URL_PARAMS, rpcSequence, setupEmbeddedWallet } from '~/playwright/fixtures/embeddedWallet'
import { stubTradingApiEndpoint } from '~/playwright/fixtures/tradingApi'
import { HAYDEN_ADDRESS, HAYDEN_ENS, TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'

const test = getTest({ withAnvil: true })

const SEND_AMOUNT_ETH = '10' // $10 worth
const SEND_AMOUNT_USDC = '10' // 10 USDC
const USDC_ADDRESS = assume0xAddress(USDC.address)
const SENDER = assume0xAddress(TEST_WALLET_ADDRESS)
const RECIPIENT = assume0xAddress(HAYDEN_ADDRESS)
const HAYDEN = { address: HAYDEN_ADDRESS, displayName: HAYDEN_ENS }

/** 1x1 transparent PNG so token logos "load" and don't fall back to the pointer-capturing monogram. */
const ONE_PX_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)

/** Serves a valid image for every image request so the sandbox's blocked token logos render. */
async function stubImages(page: Page): Promise<void> {
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() === 'image') {
      await route.fulfill({ contentType: 'image/png', body: ONE_PX_PNG })
      return
    }
    await route.fallback()
  })
}

/** Fixed USD spot prices; USDC gets $1, everything else falls back to ETH's. */
const STUB_ETH_PRICE_USD = 3000
const STUB_USDC_PRICE_USD = 1
const USDC_ADDRESS_NORM = normalizeTokenAddressForCache(USDC.address)

/**
 * Stubs the spot-price feed. Fiat conversion and the Send button's amount gating come from
 * `useUSDCPrice` → `usePrice` (`@universe/prices`), whose REST fallback calls the ConnectRPC
 * `data.v1.DataApiService/GetTokenPrices` unary method (Connect JSON) through the entry gateway.
 * That feed is network-blocked in the anvil sandbox, leaving the form stuck in fiat mode with a
 * disabled "Enter a larger amount" button. Echoing a non-zero USD price for every requested token
 * makes both tests hermetic.
 */
async function stubTokenPrices(page: Page): Promise<void> {
  await page.route('**/data.v1.DataApiService/GetTokenPrices', async (route) => {
    const request = route.request()
    let tokens: { chainId: number; address: string }[] = []
    try {
      const postData = request.postData()
      if (postData) {
        tokens = (JSON.parse(postData).tokens ?? []) as { chainId: number; address: string }[]
      } else {
        const messageParam = new URL(request.url()).searchParams.get('message')
        if (messageParam) {
          tokens = (JSON.parse(decodeURIComponent(messageParam)).tokens ?? []) as {
            chainId: number
            address: string
          }[]
        }
      }
    } catch {
      tokens = []
    }

    const tokenPrices = tokens.map((token) => ({
      chainId: token.chainId,
      address: token.address,
      priceUsd:
        normalizeTokenAddressForCache(token.address) === USDC_ADDRESS_NORM ? STUB_USDC_PRICE_USD : STUB_ETH_PRICE_USD,
      updatedAt: new Date().toISOString(),
    }))

    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ tokenPrices }) })
  })
}

/**
 * Stubs the trading-API transaction-status poll (`/swaps?txHashes=...`) with a canned SUCCESS.
 * After a send is submitted the app polls this endpoint; the shared `txPolling` fixture forwards
 * to the live entry gateway, which is network-blocked in the anvil sandbox. Returning SUCCESS
 * directly keeps the flow hermetic — the tests verify the outcome on-chain via anvil, not via UI
 * status.
 */
async function stubSwapStatusPolling(page: Page): Promise<void> {
  await page.route(/\/swaps\?txHashes=/, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ requestId: '', swaps: [{ status: 'SUCCESS', swapType: 'CLASSIC' }] }),
    })
  })
}

/** Fills the form and confirms; resolves once the review modal closes, i.e. the tx was submitted. */
async function submitSend({
  page,
  amount,
  recipient,
}: {
  page: Page
  amount: string
  recipient: { address: string; displayName: string }
}): Promise<void> {
  await page.getByTestId(TestID.SendFormAmountInput).click()
  await page.getByTestId(TestID.SendFormAmountInput).fill(amount)
  const recipientInput = page.getByPlaceholder(/address or ens/i)
  await recipientInput.click()
  await recipientInput.fill(recipient.address)
  await page.getByText(recipient.displayName).click()
  const sendButton = page.getByRole('button', { name: /^send$/i })
  await expect(sendButton).toBeEnabled()
  await sendButton.click()
  await page.getByRole('button', { name: /continue/i }).click()
  await expect(page.getByTestId(TestID.SendReviewModal)).toBeVisible()
  await page.getByRole('button', { name: /confirm send/i }).click()
  await expect(page.getByTestId(TestID.SendReviewModal)).not.toBeVisible()
}

async function usdcBalances(anvil: AnvilClient): Promise<{ sender: bigint; recipient: bigint }> {
  const [sender, recipient] = await Promise.all([
    anvil.getErc20Balance(USDC_ADDRESS, SENDER),
    anvil.getErc20Balance(USDC_ADDRESS, RECIPIENT),
  ])
  return { sender, recipient }
}

/**
 * Funds 100 USDC and opens the send form with USDC preselected through SendFormModal's own URL params;
 * the token-selector rows are unclickable headless. Returns the starting balances.
 */
async function openUsdcSendWithEmbeddedWallet({
  page,
  anvil,
}: {
  page: Page
  anvil: AnvilClient
}): Promise<{ sender: bigint; recipient: bigint }> {
  await anvil.setErc20Balance({ address: USDC_ADDRESS, balance: 100_000_000n })
  const initial = await usdcBalances(anvil)
  await page.goto(`/send?sendCurrency=${USDC.address}&sendChain=ethereum&${EMBEDDED_WALLET_URL_PARAMS}`)
  await expect(page.getByText('Balance: 100.00')).toBeVisible()
  return initial
}

/** The embedded wallet broadcast resolves after the review modal closes, so poll until the transfer lands. */
async function expectUsdcSent({
  anvil,
  initial,
}: {
  anvil: AnvilClient
  initial: { sender: bigint; recipient: bigint }
}): Promise<void> {
  await expect.poll(() => anvil.getErc20Balance(USDC_ADDRESS, SENDER), { timeout: 30_000 }).toBeLessThan(initial.sender)
  const final = await usdcBalances(anvil)
  expect(initial.sender - final.sender).toBe(final.recipient - initial.recipient)
}

test.describe(
  'Send',
  {
    tag: '@team:apps-infra',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-infra' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test.beforeEach(async ({ page }) => {
      // Serve token logos (network-blocked in the sandbox) so token-selector rows stay clickable.
      await stubImages(page)
      // Hermetic spot price so the amount button enables without the live (network-blocked) feed.
      await stubTokenPrices(page)
      // Hermetic post-submit status poll so the shared txPolling fixture doesn't hit the live gateway.
      await stubSwapStatusPolling(page)
    })

    test('should send ETH to recipient', async ({ page, anvil }) => {
      await stubTradingApiEndpoint({ page, endpoint: V1_TRADING_API_PATHS.quote })
      await page.goto('/send')
      const [initialSenderBalance, initialRecipientBalance] = await Promise.all([
        anvil.getBalance({ address: TEST_WALLET_ADDRESS }),
        anvil.getBalance({ address: HAYDEN_ADDRESS }),
      ])

      await submitSend({ page, amount: SEND_AMOUNT_ETH, recipient: HAYDEN })
      await anvil.mine({ blocks: 1 })

      expect(await anvil.getBalance({ address: TEST_WALLET_ADDRESS })).toBeLessThan(initialSenderBalance)
      expect(await anvil.getBalance({ address: HAYDEN_ADDRESS })).toBeGreaterThan(initialRecipientBalance)
    })

    test('should send USDC with an embedded wallet', async ({ page, anvil }) => {
      const embeddedWallet = await setupEmbeddedWallet(page)
      await stubTradingApiEndpoint({ page, endpoint: V1_TRADING_API_PATHS.quote })
      const initial = await openUsdcSendWithEmbeddedWallet({ page, anvil })

      await submitSend({ page, amount: SEND_AMOUNT_USDC, recipient: HAYDEN })
      await expectUsdcSent({ anvil, initial })

      expect(rpcSequence(embeddedWallet)).toEqual([
        'Challenge:WALLET_SIGNIN',
        'WalletSignIn',
        'Challenge:SIGN_TRANSACTION',
        'SignTransaction',
      ])
      expect(embeddedWallet.signedTransactions).toHaveLength(1)
    })
  },
)
