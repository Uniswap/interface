import { LiquidityService } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_connect'
import { CHAIN_TO_ADDRESSES_MAP } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { LIVE_V3_TOKEN_ID, transferPositionToTestWallet } from '~/playwright/anvil/positions'
import { createExpectSingleTransaction } from '~/playwright/anvil/transactions'
import { expect, getTest } from '~/playwright/fixtures'
import {
  mockGetPosition,
  stubGetPositionFields,
  stubLiquidityServiceEndpoint,
} from '~/playwright/fixtures/liquidityService'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'
import { Mocks } from '~/playwright/mocks/mocks'

const MOCK_V4_TOKEN_ID = 13281n
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
      const liveOwner = await transferPositionToTestWallet({
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

      // ClaimFees derives v3 fees by simulating collect on live mainnet as walletAddress, and rejects a
      // non-owner. Only the fork moved the NFT, so request as the live owner, then hand `from` back to
      // the test wallet (the fork owner) that sends the tx. The calldata's fee recipient stays the live owner.
      await stubLiquidityServiceEndpoint({
        page,
        endpoint: LiquidityService.methods.claimFees,
        service: LiquidityService,
        modifyRequestData: (data) => ({ ...data, walletAddress: liveOwner }),
        modifyResponseData: (data) =>
          data?.claim ? { ...data, claim: { ...data.claim, from: TEST_WALLET_ADDRESS } } : data,
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
