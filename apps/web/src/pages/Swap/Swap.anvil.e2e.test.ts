import { MaxUint160, MaxUint256, PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { UNIVERSAL_ROUTER_ADDRESS, UniversalRouterVersion } from '@uniswap/universal-router-sdk'
import { TradingApi } from '@universe/api'
import { ONE_MILLION_USDT } from 'playwright/anvil/utils'
import { expect, getTest } from 'playwright/fixtures'
import { stubTradingApiEndpoint } from 'playwright/fixtures/tradingApi'
import { TEST_WALLET_ADDRESS } from 'playwright/fixtures/wallets'
import { USDT } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { assume0xAddress } from 'utils/wagmi'
import { parseEther } from 'viem'

const test = getTest({ withAnvil: true })

test.describe(
  'Swap',
  {
    tag: '@team:apps-swap',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-swap' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('should swap ETH to USDC', async ({ page, anvil }) => {
      await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.swap })
      await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.quote })
      await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: 100_000_000n })

      await page.goto('/swap')

      await page.getByTestId(TestID.ChooseOutputToken).click()
      // Select USDT token
      // eslint-disable-next-line
      await page.getByTestId('token-option-1-USDT').first().click()
      // Confirm wallet balance is shown
      await expect(page.getByText('100 USDT')).toBeVisible()

      await page.getByTestId(TestID.AmountInputIn).click()
      await page.getByTestId(TestID.AmountInputIn).fill('.1')
      await page.getByTestId(TestID.ReviewSwap).click()
      await page.getByTestId(TestID.Swap).click()

      await expect(page.getByText('Swapped')).toBeVisible()

      const ethBalance = await anvil.getBalance({
        address: TEST_WALLET_ADDRESS,
      })
      await expect(ethBalance).toBeLessThan(parseEther('9999.9'))
      await expect(page.getByText('9,999.9 ETH')).toBeVisible()
    })

    test('should be able to swap token with FOT warning via TDP', async ({ page, anvil }) => {
      await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.quote })

      await page.route(`${uniswapUrls.tradingApiUrl}/v1/swap`, async (route) => {
        const request = route.request()
        const postData = request.postDataJSON()

        // Modify the request to set simulateTransaction to false
        // because we can't actually simulate the transaction or it will fail
        const modifiedData = {
          ...postData,
          simulateTransaction: false,
        }

        await route.continue({
          postData: JSON.stringify(modifiedData),
        })
      })

      await page.goto('/explore/tokens/ethereum/0x32b053f2cba79f80ada5078cb6b305da92bde6e1')
      await page.getByTestId(TestID.AmountInputIn).click()
      await page.getByTestId(TestID.AmountInputIn).fill('10')
      await page.getByTestId(TestID.ReviewSwap).click()

      // See token warning modal & confirm warning
      await expect(page.getByText('Fee detected')).toHaveCount(2)
      await page.getByTestId(TestID.Confirm).click()

      // See swap review screen & confirm swap
      await page.getByTestId(TestID.Swap).click()

      // Confirm price impact warning
      await page.getByTestId(TestID.Confirm).click()

      await anvil.mine({
        blocks: 1,
      })

      const ethBalance = await anvil.getBalance({
        address: TEST_WALLET_ADDRESS,
      })

      await expect(ethBalance).toBeLessThan(parseEther('10000'))
    })

    test('should bridge from ETH to L2', async ({ page, anvil }) => {
      await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.swap })
      await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.quote })
      await page.goto(`/swap?inputCurrency=ETH`)
      await page.getByTestId(TestID.ChooseOutputToken).click()
      await page.getByTestId(`token-option-${UniverseChainId.Base}-ETH`).first().click()
      expect(
        await page
          .locator('div')
          .filter({ hasText: /^EthereumBase$/ })
          .first(),
      ).toBeVisible()
      await page.getByTestId(TestID.AmountInputIn).click()
      await page.getByTestId(TestID.AmountInputIn).fill('1')
      await expect(page.getByTestId(TestID.ReviewSwap)).toBeEnabled()
      await page.getByTestId(TestID.ReviewSwap).click()
      await page.getByTestId(TestID.Confirm).click()
      await page.getByTestId(TestID.Swap).click()

      const ethBalance = await anvil.getBalance({
        address: TEST_WALLET_ADDRESS,
      })

      await expect(ethBalance).toBeLessThan(parseEther('9999'))
    })

    test.describe('permit2', () => {
      test.beforeEach(async ({ page }) => {
        await stubTradingApiEndpoint({
          page,
          endpoint: uniswapUrls.tradingApiPaths.quote,
          modifyRequestData: (data) => ({
            ...data,
            protocols: [TradingApi.ProtocolItems.V4, TradingApi.ProtocolItems.V3, TradingApi.ProtocolItems.V2],
          }),
        })
      })

      test('sets permit2 allowance for universal router', async ({ page, anvil }) => {
        await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.swap })
        await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
        await page.goto(`/swap?inputCurrency=${USDT.address}&outputCurrency=ETH`)
        await page.getByTestId(TestID.AmountInputIn).click()
        await page.getByTestId(TestID.AmountInputIn).fill('10')
        await page.getByTestId(TestID.ReviewSwap).click()
        await page.getByTestId(TestID.Swap).click()

        await expect(page.getByText('Approved')).toBeVisible()
        // Check Permit2 contract is an allowed spender for the USDT token
        const erc20Allowance = await anvil.getErc20Allowance({
          address: assume0xAddress(USDT.address),
          spender: PERMIT2_ADDRESS,
          owner: TEST_WALLET_ADDRESS,
        })
        await expect(erc20Allowance).toEqual(MaxUint256.toBigInt())

        // Check Permit2 allowance for universal router
        await expect(page.getByText('Swapped')).toBeVisible()
        const permit2Allowance = await anvil.getPermit2Allowance({
          owner: TEST_WALLET_ADDRESS,
          token: assume0xAddress(USDT.address),
          spender: assume0xAddress(UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V2_0, UniverseChainId.Mainnet)),
        })
        await expect(permit2Allowance.amount).toEqual(MaxUint160.toBigInt())
      })

      test('swaps with existing permit2 approval and missing token approval', async ({ page, anvil }) => {
        await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.swap })
        await stubTradingApiEndpoint({
          page,
          endpoint: uniswapUrls.tradingApiPaths.quote,
          modifyResponseData: (data) => ({
            ...data,
            permitData: null,
          }),
          modifyRequestData: (data) => ({
            ...data,
            protocols: [TradingApi.ProtocolItems.V4, TradingApi.ProtocolItems.V3, TradingApi.ProtocolItems.V2],
          }),
        })
        await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
        await anvil.setPermit2Allowance({
          owner: TEST_WALLET_ADDRESS,
          token: assume0xAddress(USDT.address),
          spender: assume0xAddress(UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V2_0, UniverseChainId.Mainnet)),
        })
        await page.goto(`/swap?inputCurrency=${USDT.address}&outputCurrency=ETH`)
        await page.getByTestId(TestID.AmountInputIn).click()
        await page.getByTestId(TestID.AmountInputIn).fill('10')
        await page.getByTestId(TestID.ReviewSwap).click()
        await page.getByTestId(TestID.Swap).click()

        await expect(page.getByText('Sign message')).not.toBeVisible()
        await expect(page.getByText('Approved')).toBeVisible()
        await expect(page.getByText('Swapped')).toBeVisible()
      })

      /**
       * On mainnet, you have to revoke USDT approval before increasing it.
       * From the token contract:
       *   To change the approve amount you first have to reduce the addresses`
       *   allowance to zero by calling `approve(_spender, 0)` if it is not
       *   already 0 to mitigate the race condition described here:
       *   https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
       */
      test('swaps USDT with existing but insufficient approval permit2', async ({ page, anvil }) => {
        await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.swap })
        await stubTradingApiEndpoint({
          page,
          endpoint: uniswapUrls.tradingApiPaths.approval,
          modifyResponseData: (data) => ({
            ...data,
            cancel: {
              to: assume0xAddress(USDT.address),
              value: '0x00',
              from: TEST_WALLET_ADDRESS,
              data: '0x095ea7b3000000000000000000000000000000000022d473030f116ddee9f6b43ac78ba30000000000000000000000000000000000000000000000000000000000000000',
              maxFeePerGas: '3900000000',
              maxPriorityFeePerGas: '2000000000',
              gasLimit: '36000',
              chainId: 1,
            },
            cancelGasFee: '200000000000000',
          }),
        })
        await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
        await anvil.setErc20Allowance({ address: assume0xAddress(USDT.address), spender: PERMIT2_ADDRESS, amount: 1n })
        await page.goto(`/swap?inputCurrency=${USDT.address}&outputCurrency=ETH`)
        await page.getByTestId(TestID.AmountInputIn).click()
        await page.getByTestId(TestID.AmountInputIn).fill('10')
        await page.getByTestId(TestID.ReviewSwap).click()
        await page.getByTestId(TestID.Swap).click()

        await expect(page.getByText('Reset USDT limit')).toBeVisible()
        await expect(page.getByText('Sign message')).toBeVisible()
        await expect(page.getByText('Approved')).toBeVisible()
        await expect(page.getByText('Swapped')).toBeVisible()
      })

      test('prompts signature when existing permit approval is expired', async ({ page, anvil }) => {
        await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.swap })
        await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
        await anvil.setPermit2Allowance({
          owner: TEST_WALLET_ADDRESS,
          token: assume0xAddress(USDT.address),
          spender: assume0xAddress(UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V2_0, UniverseChainId.Mainnet)),
          expiration: Math.floor((Date.now() - 1) / 1000),
        })
        await page.goto(`/swap?inputCurrency=${USDT.address}&outputCurrency=ETH`)
        await page.getByTestId(TestID.AmountInputIn).click()
        await page.getByTestId(TestID.AmountInputIn).fill('10')
        await page.getByTestId(TestID.ReviewSwap).click()
        await page.getByTestId(TestID.Swap).click()

        await expect(page.getByText('Sign message')).toBeVisible()
        await expect(page.getByText('Approved')).toBeVisible()
        await expect(page.getByText('Swapped')).toBeVisible()
      })

      test('prompts signature when existing permit approval amount is too low', async ({ page, anvil }) => {
        await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.swap })
        await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
        await anvil.setPermit2Allowance({
          owner: TEST_WALLET_ADDRESS,
          token: assume0xAddress(USDT.address),
          spender: assume0xAddress(UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V2_0, UniverseChainId.Mainnet)),
          amount: 1n,
        })
        await page.goto(`/swap?inputCurrency=${USDT.address}&outputCurrency=ETH`)
        await page.getByTestId(TestID.AmountInputIn).click()
        await page.getByTestId(TestID.AmountInputIn).fill('10')
        await page.getByTestId(TestID.ReviewSwap).click()
        await page.getByTestId(TestID.Swap).click()

        await expect(page.getByText('Sign message')).toBeVisible()
        await expect(page.getByText('Approved')).toBeVisible()
        await expect(page.getByText('Swapped')).toBeVisible()
      })
    })
  },
)
