import { expect, getTest } from 'playwright/fixtures'
import { Mocks } from 'playwright/mocks/mocks'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const test = getTest()

test.describe(
  'Token Details',
  {
    tag: '@team:apps-portfolio',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-portfolio' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('token with warning and low trading volume should have all information populated', async ({
      page,
      graphql,
    }) => {
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

    test('disconnected wallet on mainnet mode should load mainnet token details', async ({ page }) => {
      await page.goto('/explore/tokens/ethereum/NATIVE?eagerlyConnect=false')
      await expect(page.getByText('Ethereum').first()).toBeVisible()
    })

    test('connected wallet on mainnet mode should load testnet token details', async ({ page, graphql }) => {
      await graphql.intercept('TokenWeb', Mocks.TokenWeb.sepolia_yay_token, {
        chain: 'ETHEREUM_SEPOLIA',
        address: '0x97dbb794244e1c27b6ff688fc8cef5fe8d80f531',
      })
      await graphql.intercept('Token', Mocks.Token.sepolia_yay_token, {
        chain: 'ETHEREUM_SEPOLIA',
        address: '0x97dbb794244e1c27b6ff688fc8cef5fe8d80f531',
      })
      await page.goto('/explore/tokens/ethereum_sepolia/0x97dbb794244e1c27b6ff688fc8cef5fe8d80f531')
      await expect(page.getByText('Yay').first()).toBeVisible()
    })

    test('connected wallet on testnet mode should load mainnet token details', async ({ page }) => {
      await page.goto('/explore/tokens/ethereum/NATIVE')
      await page.getByTestId(TestID.Web3StatusConnected).click()
      await page.getByTestId(TestID.WalletSettings).click()
      await page.getByTestId(TestID.TestnetsToggle).click()
      await expect(page.getByText('Ethereum').first()).toBeVisible()
    })

    test('redirect to explore if token is not found', async ({ page }) => {
      await page.goto('/explore/tokens/ethereum/0x123')
      await expect(page).toHaveURL('/explore')
    })
  },
)
