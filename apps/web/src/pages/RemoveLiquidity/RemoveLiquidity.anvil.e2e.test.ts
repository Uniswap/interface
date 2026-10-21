import { LiquidityService } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_connect'
import { CHAIN_TO_ADDRESSES_MAP } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { USDT } from 'uniswap/src/constants/tokens'
import { erc721Abi } from 'viem'
import { mainnet } from 'viem/chains'
import { assume0xAddress } from '~/chains'
import { ONE_MILLION_USDT } from '~/playwright/anvil/utils'
import { expect, getTest } from '~/playwright/fixtures'
import { mockGetPosition, stubLiquidityServiceEndpoint } from '~/playwright/fixtures/liquidityService'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'
import { Mocks } from '~/playwright/mocks/mocks'

const MOCK_V4_TOKEN_ID = 13281n

// The decrease executes on the pinned fork, but the liquidity service prices the calldata's minimum
// amounts against LIVE mainnet. The ETH price gap between the two grows as the pin ages and trips the
// v4 decrease's MinimumAmountInsufficient guard. Force a generous — but sub-critical (see
// SLIPPAGE_CRITICAL_TOLERANCE = 20) — slippage so fork-vs-live drift can't fail the decrease.
const E2E_DECREASE_SLIPPAGE_TOLERANCE = 15

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
      // Impersonation is node config that survives evm_revert; stop it so it can't leak into later tests.
      await anvil.stopImpersonatingAccount({ address: realOwner })

      await stubLiquidityServiceEndpoint({
        page,
        endpoint: LiquidityService.methods.decreasePosition,
        service: LiquidityService,
        modifyRequestData: (data) => ({ ...data, slippageTolerance: E2E_DECREASE_SLIPPAGE_TOLERANCE }),
      })
      // Serve the position read from a fixture (test wallet as owner, known liquidity) so the
      // ownership-gated "Remove liquidity" action renders; the live read returns the position's real
      // mainnet owner.
      await mockGetPosition({ page, mockPath: Mocks.LiquidityService.get_v4_position_multi_token_rewards })
      await anvil.setErc20Balance({ address: assume0xAddress(USDT.address), balance: ONE_MILLION_USDT })
      // Target the position that was transferred to the test wallet above, so the decrease executes on-chain.
      await page.goto(`/positions/v4/ethereum/${MOCK_V4_TOKEN_ID}`)
      await page.getByRole('button', { name: 'Remove liquidity' }).dblclick()
      await page.locator('div').filter({ hasText: /^50%$/ }).click()

      await page.getByRole('button', { name: 'Review' }).click()
      await page.getByRole('button', { name: 'Confirm' }).click()
      // The amounts shown are the service's live quote, so assert the decrease settled rather than a fixed amount.
      await expect(page.getByText('Removed liquidity').first()).toBeVisible()
    })
  },
)
