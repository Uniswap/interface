import { V1_TRADING_API_PATHS } from '@universe/api'
import { HexString } from '@universe/encoding'
import { FeatureFlags, getFeatureFlagName } from '@universe/gating'
import { USDC } from 'uniswap/src/constants/tokens'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { normalizeTokenAddressForCache } from 'uniswap/src/utils/currencyId'
import { privateKeyToAccount } from 'viem/accounts'
import { assume0xAddress } from '~/chains'
import { TEST_WALLET_PRIVATE_KEY } from '~/playwright/anvil/anvil-manager'
import { expect, getTest, type Page } from '~/playwright/fixtures'
import { stubTradingApiEndpoint } from '~/playwright/fixtures/tradingApi'
import { HAYDEN_ADDRESS, TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'

const test = getTest({ withAnvil: true })

const SEND_AMOUNT_ETH = '10' // $10 worth
const SEND_AMOUNT_USDC = '10' // 10 USDC

const EW_ENABLED = `featureFlagOverride=${getFeatureFlagName(FeatureFlags.EmbeddedWallet)}`

const TEST_WALLET_ID = 'test-wallet-id'

const CHALLENGE_URL = '**/uniswap.privyembeddedwallet.v1.EmbeddedWalletService/Challenge'
const WALLET_SIGNIN_URL = '**/uniswap.privyembeddedwallet.v1.EmbeddedWalletService/WalletSignIn'
const SIGN_TRANSACTION_URL = '**/uniswap.privyembeddedwallet.v1.EmbeddedWalletService/SignTransaction'

/**
 * Standard passkey auth challenge — carries `challengeOptions` so the WebAuthn ceremony
 * (mocked via navigator.credentials) can complete during refreshNeckSession (WALLET_SIGNIN).
 */
const AUTH_CHALLENGE_RESPONSE = JSON.stringify({
  challengeOptions: JSON.stringify({
    challenge: 'dGVzdC1jaGFsbGVuZ2U', // base64url "test-challenge"
    timeout: 60000,
    rpId: 'localhost',
    allowCredentials: [{ id: 'Y3JlZC1pY2xvdWQtMQ', type: 'public-key' }],
    userVerification: 'required',
  }),
})

/**
 * NECK device-session challenge for SIGN_TRANSACTION. `sessionActive=true` lets
 * signWithDeviceSessionOrPasskey sign with the in-memory device key (no interactive
 * passkey); `signingPayload` is the base64url payload signWithDeviceKey signs.
 */
const NECK_SIGN_TRANSACTION_CHALLENGE_RESPONSE = JSON.stringify({
  sessionActive: true,
  signingPayload: 'dGVzdC1zaWduaW5nLXBheWxvYWQ', // base64url "test-signing-payload"
})

/** Sets embedded wallet state in localStorage before page navigation */
async function setupEmbeddedWalletState(page: Page): Promise<void> {
  await page.addInitScript(
    ({ walletId, walletAddress }) => {
      localStorage.setItem(
        'embedded-wallet',
        JSON.stringify({
          walletId,
          walletAddress,
          chainId: 1,
          isConnected: true,
        }),
      )
    },
    { walletId: TEST_WALLET_ID, walletAddress: TEST_WALLET_ADDRESS },
  )
}

/**
 * Mocks navigator.credentials at the browser level to simulate WebAuthn responses.
 * Uses page.addInitScript so it runs before any app code loads.
 */
async function setupWebAuthnMock(page: Page, credentialId = 'cred-icloud-1'): Promise<void> {
  await page.addInitScript((credId) => {
    const emptyBuf = new Uint8Array([0]).buffer

    const mockGetResult = {
      id: credId,
      rawId: emptyBuf,
      type: 'public-key' as const,
      authenticatorAttachment: 'platform' as const,
      getClientExtensionResults: () => ({}),
      response: {
        clientDataJSON: emptyBuf,
        authenticatorData: emptyBuf,
        signature: emptyBuf,
        userHandle: null,
      },
    }

    Object.defineProperty(navigator, 'credentials', {
      configurable: true,
      value: {
        get: async () => mockGetResult,
        create: async () => mockGetResult,
        preventSilentAccess: async () => {},
      },
    })
  }, credentialId)
}

/**
 * NECK device-session mocks. listAuthenticators isn't reached here; the send flow only
 * needs WALLET_SIGNIN (registers the NECK) + the SIGN_TRANSACTION challenge/signing.
 */
async function setupNeckMocks(page: Page): Promise<void> {
  await setupWebAuthnMock(page)
  await page.route(WALLET_SIGNIN_URL, async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({}) })
  })
  await page.route(CHALLENGE_URL, async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>
    if (body.action === 'SIGN_TRANSACTION') {
      await route.fulfill({ contentType: 'application/json', body: NECK_SIGN_TRANSACTION_CHALLENGE_RESPONSE })
    } else {
      // WALLET_SIGNIN (NECK refresh) and any other action return the passkey ceremony options.
      await route.fulfill({ contentType: 'application/json', body: AUTH_CHALLENGE_RESPONSE })
    }
  })
}

/**
 * Mocks the embedded-wallet SignTransaction RPC by locally signing the requested
 * transaction with the anvil test-wallet key. The provider forwards the returned
 * string straight to sendRawTransaction, so it must be a full serialized signed tx.
 */
async function setupSignTransactionMock(page: Page): Promise<void> {
  const account = privateKeyToAccount(TEST_WALLET_PRIVATE_KEY)
  await page.route(SIGN_TRANSACTION_URL, async (route) => {
    const { transaction } = route.request().postDataJSON() as { transaction: string }
    const tx = JSON.parse(transaction) as {
      to: string
      data?: string
      value?: string
      chainId: number
      maxFeePerGas: string
      maxPriorityFeePerGas: string
      gas: string
      nonce: number
    }
    const signature = await account.signTransaction({
      to: assume0xAddress(tx.to),
      data: (tx.data ?? '0x') as HexString,
      value: BigInt(tx.value ?? '0'),
      chainId: Number(tx.chainId),
      maxFeePerGas: BigInt(tx.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(tx.maxPriorityFeePerGas),
      gas: BigInt(tx.gas),
      nonce: Number(tx.nonce),
      type: 'eip1559',
    })
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ signature }) })
  })
}

/**
 * Stubs the delegation check so the transfer takes the standard (non-7702) path:
 * empty delegationDetails → deriveEmbeddedWalletDelegationResult returns null →
 * sendStandardTransaction.
 */
async function stubCheckDelegation(page: Page): Promise<void> {
  await page.route('**/wallet/check_delegation', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ requestId: '', delegationDetails: {} }),
    })
  })
}

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

      // Get initial balances
      const initialSenderBalance = await anvil.getBalance({
        address: TEST_WALLET_ADDRESS,
      })
      const initialRecipientBalance = await anvil.getBalance({
        address: HAYDEN_ADDRESS,
      })

      // Fill in amount to send
      await page.getByTestId(TestID.SendFormAmountInput).click()
      await page.getByTestId(TestID.SendFormAmountInput).fill(SEND_AMOUNT_ETH)

      // Fill in recipient address
      const recipientInput = page.getByPlaceholder(/address or ens/i)
      await recipientInput.click()
      await recipientInput.fill(HAYDEN_ADDRESS)
      await page.getByText('hayden.eth').click()

      const sendButton = page.getByRole('button', { name: /^send$/i })
      // Wait for send button to be enabled (indicates recipient is validated)
      await expect(sendButton).toBeEnabled()
      await sendButton.click()

      // Click Continue on the new address confirmation modal
      await page.getByRole('button', { name: /continue/i }).click()

      // Wait for review modal to appear
      await expect(page.getByTestId(TestID.SendReviewModal)).toBeVisible()

      // Confirm send
      await page.getByRole('button', { name: /confirm send/i }).click()

      // Wait for the modal to close (indicates transaction was submitted)
      await expect(page.getByTestId(TestID.SendReviewModal)).not.toBeVisible()

      // Mine a block to confirm the transaction
      await anvil.mine({ blocks: 1 })

      // Verify sender balance decreased
      const finalSenderBalance = await anvil.getBalance({
        address: TEST_WALLET_ADDRESS,
      })
      await expect(finalSenderBalance).toBeLessThan(initialSenderBalance)

      // Verify recipient balance increased
      const finalRecipientBalance = await anvil.getBalance({
        address: HAYDEN_ADDRESS,
      })
      await expect(finalRecipientBalance).toBeGreaterThan(initialRecipientBalance)
    })

    test('should send USDC with an embedded wallet', async ({ page, anvil }) => {
      const usdcAddress = assume0xAddress(USDC.address)
      const sender = assume0xAddress(TEST_WALLET_ADDRESS)
      const recipient = assume0xAddress(HAYDEN_ADDRESS)

      // Embedded-wallet + NECK/passkey signing setup
      await setupEmbeddedWalletState(page)
      await setupNeckMocks(page)
      await setupSignTransactionMock(page)
      await stubCheckDelegation(page)
      await stubTradingApiEndpoint({ page, endpoint: V1_TRADING_API_PATHS.quote })

      // Fund the sender with USDC (6 decimals)
      await anvil.setErc20Balance({ address: usdcAddress, balance: 100_000_000n })

      const initialSenderBalance = await anvil.getErc20Balance(usdcAddress, sender)
      const initialRecipientBalance = await anvil.getErc20Balance(usdcAddress, recipient)

      // Preselect USDC on the Send modal via its own URL params (sendCurrency/sendChain, read by
      // SendFormModal). The token-selector rows are unclickable in headless rendering, and the swap
      // page's inputCurrency param drives the background swap widget, not the send modal.
      await page.goto(`/send?sendCurrency=${USDC.address}&sendChain=ethereum&${EW_ENABLED}&eagerlyConnect=embedded`)

      // Confirm the on-chain USDC balance is shown (indicates the connected embedded wallet resolved)
      await expect(page.getByText('Balance: 100.00')).toBeVisible()

      // Fill in amount to send
      await page.getByTestId(TestID.SendFormAmountInput).click()
      await page.getByTestId(TestID.SendFormAmountInput).fill(SEND_AMOUNT_USDC)

      // Fill in recipient address
      const recipientInput = page.getByPlaceholder(/address or ens/i)
      await recipientInput.click()
      await recipientInput.fill(HAYDEN_ADDRESS)
      await page.getByText('hayden.eth').click()

      const sendButton = page.getByRole('button', { name: /^send$/i })
      await expect(sendButton).toBeEnabled()
      await sendButton.click()

      // Click Continue on the new address confirmation modal
      await page.getByRole('button', { name: /continue/i }).click()

      // Wait for review modal to appear
      await expect(page.getByTestId(TestID.SendReviewModal)).toBeVisible()

      // Confirm send
      await page.getByRole('button', { name: /confirm send/i }).click()

      // Wait for the modal to close (indicates transaction was submitted)
      await expect(page.getByTestId(TestID.SendReviewModal)).not.toBeVisible()

      // The embedded-wallet broadcast (Challenge → sign → sendRawTransaction) resolves after the
      // review modal closes, so mine until the transfer lands rather than mining exactly once.
      await expect
        .poll(
          async () => {
            await anvil.mine({ blocks: 1 })
            return await anvil.getErc20Balance(usdcAddress, sender)
          },
          { timeout: 15_000 },
        )
        .toBeLessThan(initialSenderBalance)

      const finalSenderBalance = await anvil.getErc20Balance(usdcAddress, sender)
      const finalRecipientBalance = await anvil.getErc20Balance(usdcAddress, recipient)

      // ERC-20 transfers are gas-paid in ETH, so the sender's token decrease equals
      // the recipient's token increase.
      await expect(finalRecipientBalance).toBeGreaterThan(initialRecipientBalance)
      expect(initialSenderBalance - finalSenderBalance).toBe(finalRecipientBalance - initialRecipientBalance)
    })
  },
)
