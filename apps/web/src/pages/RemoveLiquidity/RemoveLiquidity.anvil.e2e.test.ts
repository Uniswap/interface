import { getPosition } from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import { LiquidityService } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_connect'
import { CHAIN_TO_ADDRESSES_MAP } from '@uniswap/sdk-core'
import { USDT } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { erc721Abi } from 'viem'
import { mainnet } from 'viem/chains'
import { ONE_MILLION_USDT } from '~/playwright/anvil/utils'
import { expect, getTest } from '~/playwright/fixtures'
import { stubLiquidityServiceEndpoint } from '~/playwright/fixtures/liquidityService'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'
import { Mocks } from '~/playwright/mocks/mocks'
import { assume0xAddress } from '~/utils/wagmi'

const MOCK_V4_TOKEN_ID = 13281n

const test = getTest({ withAnvil: true })

test.describe(
  'Remove liquidity',
  {
    tag: '@team:apps-lp',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-lp' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('should decrease liquidity of a position', async ({ page, anvil }) => {
      const v4PositionManager = CHAIN_TO_ADDRESSES_MAP[UniverseChainId.Mainnet].v4PositionManagerAddress!

      // Transfer the position to the test wallet so the decrease tx executes on Anvil.
      const realOwner = await anvil.readContract({
        address: assume0xAddress(v4PositionManager),
        abi: erc721Abi,
        functionName: 'ownerOf',
        args: [MOCK_V4_TOKEN_ID],
      })
      await anvil.impersonateAccount({ address: realOwner })
      await anvil.writeContract({
        address: assume0xAddress(v4PositionManager),
        abi: erc721Abi,
        functionName: 'transferFrom',
        args: [realOwner, TEST_WALLET_ADDRESS, MOCK_V4_TOKEN_ID],
        account: realOwner,
        chain: mainnet,
      })

      await stubLiquidityServiceEndpoint({
        page,
        endpoint: LiquidityService.methods.decreasePosition,
        service: LiquidityService,
      })
      await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
      await page.route(
        `${uniswapUrls.apiBaseUrlV2}/${getPosition.service.typeName}/${getPosition.name}`,
        async (route) => {
          await route.fulfill({ path: Mocks.Positions.get_v4_position })
        },
      )
      await page.goto('/positions/v4/ethereum/1')
      await page.getByRole('button', { name: 'Remove liquidity' }).dblclick()
      await page.locator('div').filter({ hasText: /^50%$/ }).click()

      await page.getByRole('button', { name: 'Review' }).click()
      await page.getByRole('button', { name: 'Confirm' }).click()
      await expect(page.getByText('1.000 USDT').first()).toBeVisible()
    })
  },
)
