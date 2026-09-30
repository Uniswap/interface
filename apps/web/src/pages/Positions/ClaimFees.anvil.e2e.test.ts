import { LiquidityService } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_connect'
import { CHAIN_TO_ADDRESSES_MAP } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { erc721Abi } from 'viem'
import { mainnet } from 'viem/chains'
import { assume0xAddress } from '~/chains'
import { createExpectSingleTransaction } from '~/playwright/anvil/transactions'
import { expect, getTest } from '~/playwright/fixtures'
import type { AnvilClient } from '~/playwright/fixtures/anvil'
import {
  mockGetPosition,
  stubGetPositionFields,
  stubLiquidityServiceEndpoint,
} from '~/playwright/fixtures/liquidityService'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'
import { Mocks } from '~/playwright/mocks/mocks'

const MOCK_V4_TOKEN_ID = 13281n
// Live mainnet WETH/USDT 0.3% position with liquidity + accrued fees. The collect reads the
// position from live mainnet, so this must be a real funded position; refresh it if ever withdrawn.
const LIVE_V3_TOKEN_ID = 1362704n

/** Transfer a live mainnet position NFT to the test wallet so the collect executes on the fork. */
async function transferPositionToTestWallet({
  anvil,
  positionManager,
  tokenId,
}: {
  anvil: AnvilClient
  positionManager: string
  tokenId: bigint
}): Promise<void> {
  const realOwner = await anvil.readContract({
    address: assume0xAddress(positionManager),
    abi: erc721Abi,
    functionName: 'ownerOf',
    args: [tokenId],
  })
  await anvil.impersonateAccount({ address: realOwner })
  await anvil.writeContract({
    address: assume0xAddress(positionManager),
    abi: erc721Abi,
    functionName: 'transferFrom',
    args: [realOwner, TEST_WALLET_ADDRESS, tokenId],
    account: realOwner,
    chain: mainnet,
  })
  // Impersonation is node config that survives evm_revert; stop it so it can't leak into later tests.
  await anvil.stopImpersonatingAccount({ address: realOwner })
}

const test = getTest({ withAnvil: true })

test.describe(
  'Claim fees',
  {
    tag: '@team:apps-lp',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-lp' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('should claim fees from a v3 position', async ({ page, anvil }) => {
      // Transfer the position to the test wallet so the collect executes on-chain, and override its
      // owner on the read so the ownership-gated "Collect fees" action renders (the live read returns
      // the real owner). The position's real accrued fees drive the collect.
      await transferPositionToTestWallet({
        anvil,
        positionManager: CHAIN_TO_ADDRESSES_MAP[UniverseChainId.Mainnet].nonfungiblePositionManagerAddress!,
        tokenId: LIVE_V3_TOKEN_ID,
      })
      await stubGetPositionFields({ page })
      const expectSingleTransaction = createExpectSingleTransaction({
        anvil,
        address: TEST_WALLET_ADDRESS,
        options: { blocks: 2 },
      })

      await stubLiquidityServiceEndpoint({
        page,
        endpoint: LiquidityService.methods.claimFees,
        service: LiquidityService,
      })
      await page.goto(`/positions/v3/ethereum/${LIVE_V3_TOKEN_ID}`)

      // Hold the collect tx in the mempool so the pending "Collecting fees" state is observable.
      await anvil.setAutomine(false)

      // Perform fee claiming and verify transaction was submitted
      await expectSingleTransaction(async () => {
        await page.getByRole('button', { name: 'Collect fees' }).click()
        await page.getByTestId(TestID.ClaimFees).click()
        await expect(page.getByTestId(TestID.ActivityPopup).getByText('Collecting fees')).toBeVisible()
      })
    })

    test('should claim fees from a v4 position', async ({ page, anvil }) => {
      // Transfer the position to the test wallet so the collect executes on-chain (the live read
      // returns the real owner); the fixture then supplies the owner + fees the UI renders from.
      await transferPositionToTestWallet({
        anvil,
        positionManager: CHAIN_TO_ADDRESSES_MAP[UniverseChainId.Mainnet].v4PositionManagerAddress!,
        tokenId: MOCK_V4_TOKEN_ID,
      })
      await mockGetPosition({ page, mockPath: Mocks.LiquidityService.get_v4_position_multi_token_rewards })
      const expectSingleTransaction = createExpectSingleTransaction({
        anvil,
        address: TEST_WALLET_ADDRESS,
        options: { blocks: 2 },
      })

      await stubLiquidityServiceEndpoint({
        page,
        endpoint: LiquidityService.methods.claimFees,
        service: LiquidityService,
      })
      await page.goto('/positions/v4/ethereum/13281')

      // Hold the collect tx in the mempool so the pending "Collecting fees" state is observable;
      // expectSingleTransaction mines it explicitly. With anvil's default auto-mining the tx
      // confirms instantly and the popup jumps straight to "Collected fees".
      await anvil.setAutomine(false)

      // Perform fee claiming and verify transaction was submitted
      await expectSingleTransaction(async () => {
        await page.getByRole('button', { name: 'Collect fees' }).click()
        await page.getByTestId(TestID.ClaimFees).click()
        await expect(page.getByTestId(TestID.ActivityPopup).getByText('Collecting fees')).toBeVisible()
      })
    })
  },
)
