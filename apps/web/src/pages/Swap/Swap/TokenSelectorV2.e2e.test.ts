import type { Locator, Page } from '@playwright/test'
import { searchTokens } from '@uniswap/client-data-api/dist/data/v1/search-SearchService_connectquery'
import { UniverseChainId } from '@universe/chains'
import { FeatureFlags } from '@universe/gating'
import { TestID } from '@universe/test'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { expect, getTest } from '~/playwright/fixtures'
import { mockGetPortfolioResponse } from '~/playwright/fixtures/account'
import { createTestUrlBuilder } from '~/playwright/fixtures/urls'

const test = getTest()

// Flag-ON coverage for the M2 UX revamp (SWAP-3051). The legacy TokenSelector.e2e.test.ts
// runs unmodified and covers the flag-OFF state.
const buildSwapUrl = createTestUrlBuilder({
  basePath: '/swap',
  defaultFeatureFlags: { [FeatureFlags.TokenSelectorUxRevamp]: true },
})

const buildSendUrl = createTestUrlBuilder({
  basePath: '/send',
  defaultFeatureFlags: { [FeatureFlags.TokenSelectorUxRevamp]: true },
})

const buildLimitUrl = createTestUrlBuilder({
  basePath: '/limit',
  defaultFeatureFlags: { [FeatureFlags.TokenSelectorUxRevamp]: true },
})

test.describe(
  'TokenSelectorV2 (UX revamp flag ON)',
  {
    tag: '@team:apps-swap',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-swap' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('input - opens dual-pane with sidebar visible and chip row below search', async ({ page }) => {
      await page.goto(buildSwapUrl({}))
      await page.getByTestId(TestID.ChooseInputToken).click()

      await expect(page.getByTestId(TestID.TokenSelectorV2Sidebar)).toBeVisible()
      await expect(page.getByTestId(TestID.TokenSelectorV2NetworkChipRow)).toBeVisible()
      await expect(
        page.getByTestId(`${TestID.SectionHeaderPrefix}${OnchainItemSectionName.TrendingTokens}`),
      ).toBeVisible()
      // Your-tokens lives in the sidebar, not the main list, on desktop dual-pane
      await expect(
        page.getByTestId(`${TestID.SectionHeaderPrefix}${OnchainItemSectionName.YourTokens}`),
      ).not.toBeVisible()
      // Legacy network dropdown is gone in V2
      await expect(page.getByTestId(TestID.TokensNetworkFilterTrigger)).not.toBeVisible()
    })

    test('input - sidebar collapses to the balance toggle and re-expands', async ({ page }) => {
      await page.goto(buildSwapUrl({}))
      await page.getByTestId(TestID.ChooseInputToken).click()

      await expect(page.getByTestId(TestID.TokenSelectorV2Sidebar)).toBeVisible()

      // Collapse via the sidebar-header collapse button: sidebar disappears,
      // the avatar + balance toggle appears next to the search field
      await page.getByTestId(TestID.TokenSelectorV2SidebarCollapse).click()
      await expect(page.getByTestId(TestID.TokenSelectorV2Sidebar)).not.toBeVisible()

      // Re-expand from the inline toggle next to the search field
      await page.getByTestId(TestID.TokenSelectorV2SidebarToggle).click()
      await expect(page.getByTestId(TestID.TokenSelectorV2Sidebar)).toBeVisible()
    })

    test('output - opens full-width with sidebar collapsed and expands via the header toggle', async ({ page }) => {
      await page.goto(buildSwapUrl({}))
      await page.getByTestId(TestID.ChooseOutputToken).click()

      await expect(page.getByTestId(TestID.TokenSelectorV2NetworkChipRow)).toBeVisible()
      await expect(page.getByTestId(TestID.TokenSelectorV2Sidebar)).not.toBeVisible()
      await expect(page.getByTestId(TestID.TokenSelectorV2SidebarToggle)).toBeVisible()

      await page.getByTestId(TestID.TokenSelectorV2SidebarToggle).click()
      await expect(page.getByTestId(TestID.TokenSelectorV2Sidebar)).toBeVisible()
    })

    test('chip select - filters the list without remounting and deselects back to All Networks', async ({ page }) => {
      await page.goto(buildSwapUrl({}))
      await page.getByTestId(TestID.ChooseOutputToken).click()

      const polygonChip = page.getByTestId(`${TestID.TokenSelectorV2NetworkChipPrefix}${UniverseChainId.Polygon}`)
      const allNetworksChip = page.getByTestId(`${TestID.TokenSelectorV2NetworkChipPrefix}all`)
      await expect(allNetworksChip).toHaveAttribute('aria-selected', 'true')

      // Select the Polygon chip: it becomes the active chip, list refilters, trending stays visible
      await polygonChip.click()
      await expect(polygonChip).toHaveAttribute('aria-selected', 'true')
      await expect(allNetworksChip).toHaveAttribute('aria-selected', 'false')
      await expect(
        page.getByTestId(`${TestID.SectionHeaderPrefix}${OnchainItemSectionName.TrendingTokens}`),
      ).toBeVisible()

      // Tapping the active chip deselects back to All Networks
      await polygonChip.click()
      await expect(polygonChip).toHaveAttribute('aria-selected', 'false')
      await expect(allNetworksChip).toHaveAttribute('aria-selected', 'true')

      // On All Networks the output selector stacks Recent → Suggested → Stocks → Bridging above
      // Trending (SWAP-3039 section order), putting the trending header below the react-window
      // render window — unmounted rows can never become visible without scrolling. Wheel in
      // small steps until it mounts: steps stay well under the list viewport so the 40px header
      // row can't jump across it in one step, and once scrolled past, the sticky section header
      // remounts the same testID, so an overshoot still terminates the loop.
      const trendingHeader = page.getByTestId(`${TestID.SectionHeaderPrefix}${OnchainItemSectionName.TrendingTokens}`)
      // Put the pointer over the scrollable list so wheel events land on it
      await page.getByTestId(`${TestID.TokenSelectorV2SuggestedTilePrefix}ETH`).first().hover()
      await expect(async () => {
        await page.mouse.wheel(0, 250)
        await expect(trendingHeader).toBeVisible({ timeout: 500 })
      }).toPass({ timeout: 15_000, intervals: [100] })
    })

    test('chip row - stays visible and functional during search', async ({ page }) => {
      await page.goto(buildSwapUrl({}))
      await page.getByTestId(TestID.ChooseOutputToken).click()

      await page.getByTestId(TestID.ExploreSearchInput).fill('USD')

      await expect(page.getByTestId(TestID.TokenSelectorV2NetworkChipRow)).toBeVisible()
      await page.getByTestId(`${TestID.TokenSelectorV2NetworkChipPrefix}${UniverseChainId.Mainnet}`).click()
      await expect(page.getByTestId(TestID.TokenSelectorV2NetworkChipRow)).toBeVisible()
    })

    test('chip row - +N overflow chip expands the compact row to all networks', async ({ page }) => {
      await page.goto(buildSwapUrl({}))
      // Input selector renders the compact chip row (first 8 chips + a +N overflow chip)
      await page.getByTestId(TestID.ChooseInputToken).click()

      const chipRow = page.getByTestId(TestID.TokenSelectorV2NetworkChipRow)
      await expect(chipRow).toBeVisible()

      const chips = chipRow.locator(`[data-testid^="${TestID.TokenSelectorV2NetworkChipPrefix}"]`)
      const overflowChip = chipRow.getByText(/^\+\d+$/)
      await expect(overflowChip).toBeVisible()
      const compactCount = await chips.count()

      await overflowChip.click()

      // Overflow chip is gone and the previously hidden chips are revealed
      await expect(overflowChip).not.toBeVisible()
      await expect.poll(() => chips.count()).toBeGreaterThan(compactCount)
    })

    test('sidebar select - picking a token from the sidebar selects it', async ({ page }) => {
      await page.goto(buildSwapUrl({}))
      await page.getByTestId(TestID.ChooseInputToken).click()

      await expect(page.getByTestId(TestID.TokenSelectorV2Sidebar)).toBeVisible()

      // USDT is in the e2e wallet fixture's portfolio balances
      await page
        .getByTestId(`${TestID.TokenSelectorV2SidebarTokenOptionPrefix}${UniverseChainId.Mainnet}-USDT`)
        .first()
        .click()

      // Selector closes and the input token is set
      await expect(page.getByTestId(TestID.TokenSelectorV2Sidebar)).not.toBeVisible()
      await expect(page.getByTestId(TestID.ChooseInputToken)).toContainText('USDT')
    })

    test('search - sidebar stays visible while searching on input selector', async ({ page }) => {
      await page.goto(buildSwapUrl({}))
      await page.getByTestId(TestID.ChooseInputToken).click()

      await page.getByTestId(TestID.ExploreSearchInput).fill('USDC')

      await expect(page.getByTestId(TestID.TokenSelectorV2Sidebar)).toBeVisible()
    })

    test('suggested select - tapping a suggested tile selects the token', async ({ page }) => {
      await page.goto(buildSwapUrl({}))
      await page.getByTestId(TestID.ChooseOutputToken).click()

      // ETH is always present via common bases
      await page.getByTestId(`${TestID.TokenSelectorV2SuggestedTilePrefix}ETH`).first().click()

      // Selector closes and the output token is set
      await expect(page.getByTestId(TestID.TokenSelectorV2NetworkChipRow)).not.toBeVisible()
      await expect(page.getByTestId(TestID.ChooseOutputToken)).toContainText('ETH')
    })

    test('search select - picking a search result selects the token', async ({ page }) => {
      // Mock the search backend so the result set (and its ranking) is deterministic.
      // Scoped to this test only — the rest of the suite exercises the real backend.
      await page.route(`**/${searchTokens.service.typeName}/${searchTokens.name}`, async (route) => {
        await route.fulfill({
          json: {
            tokens: [
              {
                tokenId: 'TOKEN:1:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                chainId: 1,
                address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                decimals: 6,
                symbol: 'USDC',
                name: 'USD Coin',
                standard: 'ERC20',
                projectName: 'USD Coin',
                logoUrl: '',
                isSpam: 'false',
                safetyLevel: 'VERIFIED',
              },
            ],
          },
        })
      })

      await page.goto(buildSwapUrl({}))
      await page.getByTestId(TestID.ChooseOutputToken).click()

      await page.getByTestId(TestID.ExploreSearchInput).fill('USDC')
      await page.getByTestId(`token-option-${UniverseChainId.Mainnet}-USDC`).first().click()

      await expect(page.getByTestId(TestID.TokenSelectorV2NetworkChipRow)).not.toBeVisible()
      await expect(page.getByTestId(TestID.ChooseOutputToken)).toContainText('USDC')
    })

    test('send - renders V2 single-pane with chips and no sidebar', async ({ page }) => {
      await page.goto(buildSendUrl({}))
      await page.getByTestId(TestID.SendFormSelectToken).click()

      await expect(page.getByTestId(TestID.TokenSelectorV2NetworkChipRow)).toBeVisible()
      await expect(page.getByTestId(TestID.TokenSelectorV2Sidebar)).not.toBeVisible()
      await expect(page.getByTestId(TestID.TokenSelectorV2SidebarToggle)).not.toBeVisible()
      await expect(page.getByTestId(TestID.TokenSelectorV2SidebarCollapse)).not.toBeVisible()
    })

    test('crosschain promo banner still renders in V2 when chained actions is enabled', async ({ page }) => {
      await page.goto(buildSwapUrl({ featureFlags: { [FeatureFlags.ChainedActions]: true } }))
      await page.getByTestId(TestID.ChooseOutputToken).click()

      await expect(page.getByText('Crosschain swaps are here')).toBeVisible()
    })

    test('mobile web - limit selector keeps its sections on reopen (SWAP-3250)', async ({ page }) => {
      // ≤640px renders the selector as the mobile-web bottom sheet instead of the dialog
      await page.setViewportSize({ width: 449, height: 900 })
      await mockGetPortfolioResponse({ page })
      await page.goto(buildLimitUrl({}))

      // Wheel in small steps until the section header mounts: sections below the react-window
      // render window are unmounted and can never become visible without scrolling (same
      // pattern as the chip-select test above).
      const scrollUntilVisible = async (locator: Locator): Promise<void> => {
        await page.getByTestId(`${TestID.TokenSelectorV2SuggestedTilePrefix}ETH`).first().hover()
        await expect(async () => {
          await page.mouse.wheel(0, 250)
          await expect(locator).toBeVisible({ timeout: 500 })
        }).toPass({ timeout: 15_000, intervals: [100] })
      }

      const yourTokensHeader = page.getByTestId(`${TestID.SectionHeaderPrefix}${OnchainItemSectionName.YourTokens}`)
      const openBuySelector = () => page.locator('.open-currency-select-button').last().click()

      await openBuySelector()
      await scrollUntilVisible(yourTokensHeader)

      await page.keyboard.press('Escape')
      await expect(yourTokensHeader).not.toBeVisible()

      // Reopening with all queries cached must still render the full list: the sheet takes its
      // height from the snap point, not content-fit, so the height-fitting list can't collapse it.
      await openBuySelector()
      await scrollUntilVisible(yourTokensHeader)
    })

    test.describe('mobile web - drag-dismiss then reopen (SWAP-3263)', () => {
      // ≤640px renders the selector as the mobile-web bottom sheet; hasTouch enables the
      // touch input a phone user drag-dismisses with.
      test.use({ hasTouch: true, viewport: { width: 449, height: 900 } })

      const OPEN_SHEET = '.uw-sheet-frame[data-state="open"]'

      /** Drag the sheet's handlebar down far past the dismiss threshold with real touch input. */
      async function dragDismissSheet(page: Page): Promise<void> {
        const frame = page.locator(OPEN_SHEET).last()
        const box = await frame.boundingBox()
        expect(box).not.toBeNull()
        if (!box) {
          return
        }
        const cdp = await page.context().newCDPSession(page)
        const startY = box.y + 12
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 224, y: startY }] })
        for (let step = 1; step <= 12; step++) {
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ x: 224, y: startY + step * 40 }],
          })
          await page.waitForTimeout(16)
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
        await expect(page.locator(OPEN_SHEET)).toHaveCount(0)
      }

      test('selector reopens full-height with rows after drag-dismissing the sheet', async ({ page }) => {
        await mockGetPortfolioResponse({ page })
        await page.goto(buildSwapUrl({}))
        const suggestedEth = page.getByTestId(`${TestID.TokenSelectorV2SuggestedTilePrefix}ETH`).first()

        await page.getByTestId(TestID.ChooseOutputToken).tap()
        const frame = page.locator(OPEN_SHEET).last()
        await expect(frame).toBeVisible()
        await expect(suggestedEth).toBeVisible()

        await dragDismissSheet(page)

        // Reopen with all queries cached: the sheet must come back at its snap-point height with
        // content rendered — not collapsed to chrome height with an empty list (SWAP-3263).
        await page.getByTestId(TestID.ChooseOutputToken).tap()
        await expect(frame).toBeVisible()
        await expect(suggestedEth).toBeVisible()
        const reopenedBox = await frame.boundingBox()
        expect(reopenedBox).not.toBeNull()
        expect(reopenedBox?.height ?? 0).toBeGreaterThan(300)
      })
    })
  },
)
