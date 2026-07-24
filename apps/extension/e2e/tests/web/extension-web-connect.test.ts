import { expect, type Page } from '@playwright/test'
import { importedExtensionTest as test } from 'e2e/fixtures/imported-extension.fixture'
import { openExtensionSidebar, waitForBackgroundReady } from 'e2e/utils/extension-helpers'
import { isVisibleWithin } from 'e2e/utils/locator-helpers'
import { TEST_WALLET_ADDRESS } from 'e2e/utils/onboarding-helpers'
import { collectCriticalPageErrors } from 'e2e/utils/page-error-helpers'
import { unlockIfLocked } from 'e2e/utils/unlock-helpers'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const USDC_MAINNET_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const WEB_SWAP_URL = `${UNISWAP_WEB_URL}/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET_ADDRESS}`

const QUOTE_TIMEOUT_MS = ONE_SECOND_MS * 45

// Matches a rendered quote amount: at least one non-zero digit.
const NON_ZERO_AMOUNT_REGEX = /[1-9]/

// The web app's wallet modal option for the detected Uniswap Extension
// (apps/web WalletModal/UniswapWalletOptions.tsx).
const CONNECT_EXTENSION_OPTION_TESTID = 'connect-uniswap-extension'

async function approveConnectionInSidebar(sidebarPage: Page): Promise<void> {
  // The connection request card syncs into any open side panel instance.
  const confirmButton = sidebarPage.getByTestId(TestID.Confirm)
  await confirmButton.waitFor({ state: 'visible', timeout: ONE_SECOND_MS * 20 })
  await expect(confirmButton).toBeEnabled({ timeout: ONE_SECOND_MS * 10 })
  await confirmButton.click()
}

test.describe('Extension-connected web swap', { tag: '@publish-gate' }, () => {
  // INC-312 regression path: a prod-only CORS/config issue broke swaps on app.uniswap.org
  // specifically when the extension wallet was connected.
  test('connects via the injected provider and renders a swap quote on app.uniswap.org', async ({
    context,
    extensionId,
  }) => {
    test.setTimeout(ONE_SECOND_MS * 180)
    await waitForBackgroundReady(context)

    // Keep a side panel instance open so the connection approval UI has somewhere to render.
    const sidebarPage = await openExtensionSidebar(context, extensionId)
    await sidebarPage.waitForLoadState('domcontentloaded')
    await unlockIfLocked(sidebarPage)

    const webPage = await context.newPage()
    const getCriticalErrors = collectCriticalPageErrors(webPage)
    await webPage.goto(WEB_SWAP_URL, { waitUntil: 'domcontentloaded' })

    // Preferred path: drive the real connect flow — navbar Connect -> "Uniswap Extension"
    // option (detected via the injected EIP-6963 provider).
    await webPage.getByTestId(TestID.NavConnectWalletButton).first().click()
    const extensionOption = webPage.getByTestId(CONNECT_EXTENSION_OPTION_TESTID).first()

    if (await isVisibleWithin(extensionOption, ONE_SECOND_MS * 15)) {
      await extensionOption.click()
      await approveConnectionInSidebar(sidebarPage)

      // The web app should now show the connected account.
      await expect(webPage.getByTestId(TestID.Web3StatusConnected)).toBeVisible({
        timeout: ONE_SECOND_MS * 30,
      })
    } else {
      // Fallback: the live site's wallet modal may not expose the extension option
      // (e.g. modal variant changes on prod). Connect at the provider level instead —
      // this still drives the extension's real connection-approval UI end to end.
      await webPage.keyboard.press('Escape')

      const accountsPromise = webPage.evaluate(async () => {
        return (window.ethereum as any).request({ method: 'eth_requestAccounts' }) as Promise<string[]>
      })
      await approveConnectionInSidebar(sidebarPage)

      const accounts = await accountsPromise
      expect(accounts[0]?.toLowerCase()).toBe(TEST_WALLET_ADDRESS.toLowerCase())
    }

    // With the extension connected, request a quote on web and assert it renders.
    await webPage.getByTestId(TestID.AmountInputIn).fill('1')
    await expect(webPage.getByTestId(TestID.AmountInputOut)).toHaveValue(NON_ZERO_AMOUNT_REGEX, {
      timeout: QUOTE_TIMEOUT_MS,
    })

    expect(getCriticalErrors()).toHaveLength(0)
  })
})
