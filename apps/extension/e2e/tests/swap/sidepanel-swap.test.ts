import { expect, type Page } from '@playwright/test'
import { importedExtensionTest as test } from 'e2e/fixtures/imported-extension.fixture'
import { openExtensionSidebar, waitForBackgroundReady } from 'e2e/utils/extension-helpers'
import { isVisibleWithin } from 'e2e/utils/locator-helpers'
import { collectCriticalPageErrors } from 'e2e/utils/page-error-helpers'
import { unlockIfLocked } from 'e2e/utils/unlock-helpers'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const QUOTE_TIMEOUT_MS = ONE_SECOND_MS * 45

// Matches a rendered quote amount: at least one non-zero digit (e.g. "1,234.56" or "0.0042").
const NON_ZERO_AMOUNT_REGEX = /[1-9]/

async function selectOutputToken({
  page,
  chainId,
  symbol,
}: {
  page: Page
  chainId: number
  symbol: string
}): Promise<void> {
  await page.getByTestId(TestID.ChooseOutputToken).first().click()

  const tokenOption = page.getByTestId(`token-option-${chainId}-${symbol}`).first()
  if (!(await isVisibleWithin(tokenOption, ONE_SECOND_MS * 5))) {
    // Fall back to searching if the token isn't in the default lists.
    await page.getByTestId(TestID.ExploreSearchInput).fill(symbol)
  }
  await tokenOption.click()
}

test.describe('Side panel swap golden path', { tag: '@publish-gate' }, () => {
  test('renders a real ETH -> USDC quote and blocks review for the unfunded test wallet', async ({
    context,
    extensionId,
  }) => {
    test.setTimeout(ONE_SECOND_MS * 120)
    await waitForBackgroundReady(context)

    const sidebarPage = await openExtensionSidebar(context, extensionId)
    await sidebarPage.waitForLoadState('domcontentloaded')
    await unlockIfLocked(sidebarPage)

    const getCriticalErrors = collectCriticalPageErrors(sidebarPage)

    // Enter the swap flow from the home screen.
    await sidebarPage.getByTestId(TestID.PortfolioActionTileSwap).click()

    // Input currency defaults to native ETH; choose USDC (mainnet) as the output.
    await selectOutputToken({ page: sidebarPage, chainId: 1, symbol: 'USDC' })

    // Enter an input amount and assert a real quote renders in the output field.
    // This is the INC-327 regression path: a build pointed at the wrong trading API
    // renders no quote at all.
    await sidebarPage.getByTestId(TestID.AmountInputIn).fill('1')
    await expect(sidebarPage.getByTestId(TestID.AmountInputOut)).toHaveValue(NON_ZERO_AMOUNT_REGEX, {
      timeout: QUOTE_TIMEOUT_MS,
    })

    // With the quote rendered, the review button must surface the insufficient-balance
    // state (e.g. "Not enough ETH"): the deterministic test wallet is required to be
    // unfunded, and this test must never be able to submit a transaction. An enabled
    // review button means the wallet was not set up correctly (it holds funds) — fail
    // hard instead of proceeding.
    const reviewButton = sidebarPage.getByTestId(TestID.ReviewSwap)
    await expect(reviewButton).toBeVisible()
    await expect(
      reviewButton,
      'review button must be blocked on insufficient balance — the test wallet must be unfunded',
    ).toBeDisabled()
    await expect(reviewButton).toContainText(/not enough|insufficient/i)

    expect(getCriticalErrors()).toHaveLength(0)
  })
})
