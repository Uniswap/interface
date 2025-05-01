import { expect, test } from 'playwright/fixtures'
import { Mocks } from 'playwright/mocks/mocks'

test('token with warning and low trading volume should have all information populated', async ({ page, graphql }) => {
  await graphql.intercept('TokenWeb', Mocks.TokenWeb.token_warning, {
    chain: 'ETHEREUM',
    address: '0x1eFBB78C8b917f67986BcE54cE575069c0143681',
  })
  await graphql.intercept('Token', Mocks.Token.token_warning, {
    chain: 'ETHEREUM',
    address: '0x1eFBB78C8b917f67986BcE54cE575069c0143681',
  })
  await graphql.intercept('TokenProjects', Mocks.TokenProjects.token_spam, {
    contracts: [
      {
        chain: 'ETHEREUM',
        address: '0x1eFBB78C8b917f67986BcE54cE575069c0143681',
      },
    ],
  })
  await page.goto('/explore/tokens/ethereum/0x1eFBB78C8b917f67986BcE54cE575069c0143681')
  await expect(page.getByText('test token')).toBeVisible()
  await expect(page.getByText('Missing chart data')).toBeVisible()
  await expect(page.getByText('No stats available')).toBeVisible()
  await expect(page.getByText('No token information available')).toBeVisible()
})

test('disconnected wallet on testnet tdp should set testnet mode', async ({ page }) => {
  await page.goto('/explore/tokens/ethereum_sepolia/0x97dbb794244e1c27b6ff688fc8cef5fe8d80f531?eagerlyConnect=false')
  await expect(page.getByText('Yay').first()).toBeVisible()
})

test('connected wallet on testnet tdp should not set testnet mode', async ({ page }) => {
  await page.goto('/explore/tokens/ethereum_sepolia/0x97dbb794244e1c27b6ff688fc8cef5fe8d80f531')
  await expect(page.getByText('Yay')).not.toBeVisible()
})

test('redirect to explore if token is not found', async ({ page }) => {
  await page.goto('/explore/tokens/ethereum/0x123')
  await expect(page).toHaveURL('/explore')
})
