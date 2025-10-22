/* eslint-disable no-restricted-syntax */
import { expect, getTest } from 'playwright/fixtures'
import { Mocks } from 'playwright/mocks/mocks'
import { shortenAddress } from 'utilities/src/addresses'

const test = getTest()

const UNI_ADDRESS = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'

test.describe('Token details', () => {
  test('should have a single h1 tag on smaller screen size', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 })
    await page.goto(`/explore/tokens/ethereum/${UNI_ADDRESS}`)
    await expect(page.locator('h1')).toHaveCount(1)
  })

  test('UNI token should have all information populated', async ({ page, graphql }) => {
    await graphql.intercept('TokenWeb', Mocks.TokenWeb.uni_token, {
      chain: 'ETHEREUM',
      address: UNI_ADDRESS,
    })
    await graphql.intercept('Token', Mocks.Token.uni_token, {
      chain: 'ETHEREUM',
      address: UNI_ADDRESS,
    })
    await page.setViewportSize({ width: 1440, height: 900 })
    // $UNI token
    await page.goto(`/explore/tokens/ethereum/${UNI_ADDRESS}`)
    // Wait for token name to load
    await expect(page.getByText('Uniswap').first()).toBeVisible()

    // Stats should have: TVL, FDV, market cap
    await expect(page.getByTestId('token-details-stats')).toBeVisible()
    await expect(page.getByTestId('tvl')).toContainText('$')
    await expect(page.getByTestId('fdv')).toContainText('$')
    await expect(page.getByTestId('market-cap')).toContainText('$')

    // Info section should have description of token & relevant links
    await expect(page.getByTestId('token-details-info-section')).toBeVisible()
    await expect(page.getByTestId('token-description-truncated')).toContainText('UNI is the governance token')

    // Check links
    const etherscanLink = page.getByTestId('token-details-info-links').getByRole('link', { name: 'Etherscan' })
    await expect(etherscanLink).toHaveAttribute(
      'href',
      /etherscan\.io\/token\/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/,
    )

    const websiteLink = page.getByTestId('token-details-info-links').getByRole('link', { name: 'Website' })
    await expect(websiteLink).toHaveAttribute('href', /uniswap\.org/)

    const twitterLink = page.getByTestId('token-details-info-links').getByRole('link', { name: 'Twitter' })
    await expect(twitterLink).toHaveAttribute('href', new RegExp('x.com/Uniswap'))

    // Contract address should be displayed
    await expect(
      page.locator('[aria-label="breadcrumb-nav"]').getByText(shortenAddress({ address: UNI_ADDRESS })),
    ).toBeVisible()
  })
})
