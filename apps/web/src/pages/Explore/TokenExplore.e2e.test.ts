import type { Locator, Page } from '@playwright/test'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { USDT_ARBITRUM_ONE } from 'uniswap/src/constants/tokens'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { expect, getTest } from '~/playwright/fixtures'

const test = getTest()

function selectedNetworkLogo(page: Page, chainId: UniverseChainId): Locator {
  return page.getByTestId(TestID.TokensNetworkFilterTrigger).getByTestId(`${TestID.NetworkLogoPrefix}${chainId}`)
}

test.describe(
  'Token explore',
  {
    tag: '@team:apps-portfolio',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-portfolio' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('should load token leaderboard', async ({ page }) => {
      await page.goto('/explore/tokens/ethereum')

      const tokenTable = page.locator('[data-testid^="token-table-"]')
      await expect(tokenTable.first()).toBeVisible()

      // Check native token row content
      const nativeTokenRow = page.getByTestId(`${TestID.TokenTableRowPrefix}NATIVE`)
      await expect(nativeTokenRow.getByTestId(TestID.TokenName)).toContainText('Ether')
      await expect(nativeTokenRow.getByTestId(TestID.VolumeCell)).toContainText('$')
      await expect(nativeTokenRow.getByTestId(TestID.PriceCell)).toContainText('$')
      await expect(nativeTokenRow.getByTestId(TestID.FdvCell)).toContainText('$')

      // TODO(WEB-3844): test the default sorting by checking the column headers
    })

    test('should update when time window toggled', async ({ page }) => {
      await page.goto('/explore/tokens/ethereum')

      await expect(page.getByTestId(TestID.TimeSelector)).toContainText('1D')
      const dailyVolumeElement = page.getByTestId(`${TestID.TokenTableRowPrefix}NATIVE`).getByTestId(TestID.VolumeCell)
      const dailyVolume = await dailyVolumeElement.textContent()

      await page.getByTestId(TestID.TimeSelector).click()
      await page.getByTestId(TestID.TimeSelector1Y).last().click()
      const yearlyVolumeElement = page.getByTestId(`${TestID.TokenTableRowPrefix}NATIVE`).getByTestId(TestID.VolumeCell)

      const yearlyVolume = await yearlyVolumeElement.textContent()

      expect(dailyVolume).not.toEqual(yearlyVolume)
    })

    test('should navigate to token detail page when row clicked', async ({ page }) => {
      await page.goto('/explore/tokens/ethereum')

      await page.getByTestId(`${TestID.TokenTableRowPrefix}NATIVE`).click()

      await expect(page.url()).toContain('/explore/tokens/ethereum/NATIVE')
    })

    test('should update when global network changed', async ({ page }) => {
      await page.goto('/explore/tokens/ethereum')

      await expect(selectedNetworkLogo(page, UniverseChainId.Mainnet)).toBeVisible()
      await expect(page.getByTestId(`${TestID.TokenTableRowPrefix}NATIVE`)).toBeVisible()

      await page.goto('/explore/tokens/optimism')

      await expect(selectedNetworkLogo(page, UniverseChainId.Optimism)).toBeVisible()

      const nameCell = page.getByTestId(`${TestID.TokenTableRowPrefix}NATIVE`).getByTestId(TestID.NameCell)
      await expect(nameCell).toContainText('Optimistic ETH')
    })

    test('should update when token explore table network changed', async ({ page }) => {
      await page.goto('/explore/tokens/ethereum')
      await page.getByTestId(TestID.TokensNetworkFilterTrigger).click()
      await page.getByTestId(`${ElementName.NetworkButton}-${UniverseChainId.Optimism}`).last().click()
      await expect(selectedNetworkLogo(page, UniverseChainId.Optimism)).toBeVisible()
    })

    test('should show a L2 token even if the user is connected to a different network', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      await page.goto('/explore/tokens/ethereum')

      await page.getByTestId(TestID.TokensNetworkFilterTrigger).click()
      await page.getByTestId(`${ElementName.NetworkButton}-${UniverseChainId.ArbitrumOne}`).last().click()

      await expect(selectedNetworkLogo(page, UniverseChainId.ArbitrumOne)).toBeVisible()

      await page.getByTestId(`${TestID.TokenTableRowPrefix}${USDT_ARBITRUM_ONE.address}`).click()

      await expect(page).toHaveURL(/\/explore\/tokens\/arbitrum\//)
      await expect(page.getByTestId(TestID.ChooseOutputToken + '-label')).toHaveText('USDT')
    })
  },
)
