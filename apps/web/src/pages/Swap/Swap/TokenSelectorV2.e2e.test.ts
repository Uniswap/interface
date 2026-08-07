import { searchTokens } from '@uniswap/client-data-api/dist/data/v1/search-SearchService_connectquery'
import { FeatureFlags } from '@universe/gating'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { expect, getTest } from '~/playwright/fixtures'
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
      await expect(
        page.getByTestId(`${TestID.SectionHeaderPrefix}${OnchainItemSectionName.TrendingTokens}`),
      ).toBeVisible()
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
  },
)
