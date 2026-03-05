/* eslint-disable no-restricted-syntax */

import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { shortenAddress } from 'utilities/src/addresses'
import { expect, getTest } from '~/playwright/fixtures'
import { Mocks } from '~/playwright/mocks/mocks'

const test = getTest()

const UNI_ADDRESS = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'

test.describe(
  'Token details',
  {
    tag: '@team:apps-portfolio',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-portfolio' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    // There are 2 h1 tags: one in BreadcrumbNav (for SEO) and one in TokenDetailsHeader (token name)
    // This test ensures no additional h1 tags are accidentally added (e.g., from Swap tabs)
    test('should have exactly 2 h1 tags on smaller screen size', async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 600 })
      await page.goto(`/explore/tokens/ethereum/${UNI_ADDRESS}`)
      // Wait for the page to fully load
      await expect(page.getByTestId(TestID.TokenDetailsInfoContainer)).toBeVisible()
      await expect(page.locator('h1')).toHaveCount(2)
    })

    test('UNI token should have all information populated', async ({ page, graphql }) => {
      await graphql.intercept('TokenWeb', Mocks.TokenWeb.uni_token)
      await graphql.intercept('Token', Mocks.Token.uni_token)
      await graphql.intercept('TokenPrice', Mocks.Token.uni_token_price)
      await page.setViewportSize({ width: 1440, height: 900 })
      // $UNI token
      await page.goto(`/explore/tokens/ethereum/${UNI_ADDRESS}`)
      // Wait for the GraphQL response to complete before checking UI elements
      await graphql.waitForResponse('TokenWeb')
      await expect(page.getByText('Uniswap').first()).toBeVisible()

      // Stats should have: TVL, FDV, market cap
      await expect(page.getByTestId(TestID.TokenDetailsStats)).toBeVisible()
      await expect(page.getByTestId(TestID.TokenDetailsStatsTvl)).toContainText('$')
      await expect(page.getByTestId(TestID.TokenDetailsStatsFdv)).toContainText('$')
      await expect(page.getByTestId(TestID.TokenDetailsStatsMarketCap)).toContainText('$')
      await expect(page.getByTestId(TestID.TokenDetailsStatsVolume24h)).toContainText('$')

      // Info section should have description of token & relevant links
      await expect(page.getByTestId(TestID.TokenDetailsAboutSection)).toBeVisible()
      await expect(page.getByTestId(TestID.TokenDetailsDescriptionTruncated)).toContainText(
        'UNI is the governance token',
      )

      // Check links
      const infoLinks = page.getByTestId(TestID.TokenDetailsAboutLinks)
      await expect(infoLinks).toBeVisible()
      const etherscanLink = infoLinks.getByRole('link', { name: 'Etherscan' })
      await expect(etherscanLink).toHaveAttribute(
        'href',
        /etherscan\.io\/token\/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/,
      )

      const websiteLink = infoLinks.getByRole('link', { name: 'Website' })
      await expect(websiteLink).toHaveAttribute('href', /uniswap\.org/)

      const twitterLink = infoLinks.getByRole('link', { name: 'Twitter' })
      await expect(twitterLink).toHaveAttribute('href', new RegExp('x.com/Uniswap'))

      // Contract address should be displayed in header
      await expect(
        page.getByTestId(TestID.TokenDetailsInfoContainer).getByText(shortenAddress({ address: UNI_ADDRESS })),
      ).toBeVisible()
    })
  },
)
