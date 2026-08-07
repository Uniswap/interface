import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { expect, getTest } from '~/playwright/fixtures'
import { mockTradingApiSwapsStatus } from '~/playwright/fixtures/tradingApi'
import { HAYDEN_ADDRESS, TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'

// INFRA-2736: mirror Send.anvil but with the wallet connected over the REAL
// interfaceWalletConnect connector + hermetic relay + Node counterparty (see
// src/playwright/wc/*). The send's eth_sendTransaction must be answered by the paired
// counterparty and its response propagate back over the relay — the exact hop INC-316 broke,
// which stalled the flow at "Confirm in wallet".
//
// Assertion strategy (deliberate, not a shortcut): assert the flow moves PAST "Confirm in
// wallet" into a submitted/tracked activity (proves the counterparty's eth_sendTransaction
// response propagated back over the relay), plus the authoritative on-chain effect — the
// sender's balance drops on anvil (proves the counterparty received the relayed request and
// broadcast it). We intentionally do NOT assert the final "Sent" chip: the interface observes
// the confirming receipt through the WC connector's own read-RPC client, which points at a
// non-anvil RPC that is egress-blocked offline, so that chip never renders here.
//
// Fully offline: local relay + counterparty + anvil, no gateway/Trading API egress. A native
// ETH transfer needs no Trading API calldata, so no static fixtures are required here.
const test = getTest({ withAnvil: true, withWalletConnect: true })

const SEND_AMOUNT_ETH = '1'

test.describe(
  'Send via WalletConnect',
  {
    tag: '@team:apps-infra',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-infra' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('should send ETH to a recipient over a WalletConnect session', async ({ page, anvil, walletConnect }) => {
      // Extra headroom: the WC relay round-trip plus offline RPC retries make this slower than a
      // mock-connector send.
      test.setTimeout(180_000)
      // Fulfill the /swaps activity-status poll offline: the auto txPolling fixture would
      // otherwise live-fetch it and crash on the egress-blocked (non-JSON) response.
      await mockTradingApiSwapsStatus({ page })
      await page.goto('/send?wcConnect=true')
      await walletConnect.connect(page)

      const initialSenderBalance = await anvil.getBalance({ address: TEST_WALLET_ADDRESS })
      const initialRecipientBalance = await anvil.getBalance({ address: HAYDEN_ADDRESS })

      // The amount input defaults to fiat; offline there is no ETH/USD price to convert it, so
      // switch to token-denominated input (the alternate-currency toggle reads "0 ETH" at zero).
      await page.getByText('0 ETH', { exact: true }).click()
      await page.getByTestId(TestID.SendFormAmountInput).click()
      await page.getByTestId(TestID.SendFormAmountInput).fill(SEND_AMOUNT_ETH)

      // Commit the raw recipient address via Enter (reverse-ENS name suggestions require
      // gateway lookups that are unavailable offline; a checksummed address validates locally).
      const recipientInput = page.getByPlaceholder(/address or ens/i)
      await recipientInput.click()
      await recipientInput.fill(HAYDEN_ADDRESS)
      // Enter commits the validated recipient; the placeholder clears once the address
      // resolves, so press via the still-focused input rather than re-querying it.
      await page.keyboard.press('Enter')

      const sendButton = page.getByRole('button', { name: /^send$/i })
      await expect(sendButton).toBeEnabled()
      await sendButton.click()

      // New-address confirmation modal.
      await page.getByRole('button', { name: /continue/i }).click()

      await expect(page.getByTestId(TestID.SendReviewModal)).toBeVisible()
      await page.getByRole('button', { name: /confirm send/i }).click()

      // PAST "Confirm in wallet": the counterparty's eth_sendTransaction response propagated back
      // over the relay, so the transfer left the pending-signature state and is now tracked as a
      // submitted activity. Match on the amount, not the recipient: reverse-ENS naming
      // ("hayden.eth" vs the raw address) resolves non-deterministically offline.
      await expect(page.getByRole('button', { name: /1\.00 ETH to / }).first()).toBeVisible({ timeout: 60_000 })

      // Authoritative on-chain effect: the sender's ETH must drop on anvil, proving the
      // counterparty received the relayed eth_sendTransaction and broadcast it — the full
      // request/response round-trip INC-316 broke. The activity above is optimistic (rendered on
      // submit), so poll the balance until the relayed transaction lands rather than reading once.
      await expect
        .poll(async () => anvil.getBalance({ address: TEST_WALLET_ADDRESS }), { timeout: 30_000 })
        .toBeLessThan(initialSenderBalance)
      const finalRecipientBalance = await anvil.getBalance({ address: HAYDEN_ADDRESS })
      await expect(finalRecipientBalance).toBeGreaterThan(initialRecipientBalance)
    })
  },
)
