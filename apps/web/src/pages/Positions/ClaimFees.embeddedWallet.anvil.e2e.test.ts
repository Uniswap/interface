import { LiquidityService } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_connect'
import { CHAIN_TO_ADDRESSES_MAP } from '@uniswap/sdk-core'
import { areEvmAddressesEqual, keccak256, UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { LIVE_V3_TOKEN_ID, transferPositionToTestWallet } from '~/playwright/anvil/positions'
import { createExpectSingleTransaction } from '~/playwright/anvil/transactions'
import { expect, getTest } from '~/playwright/fixtures'
import { EMBEDDED_WALLET_URL_PARAMS, rpcSequence, setupEmbeddedWallet } from '~/playwright/fixtures/embeddedWallet'
import { stubGetPositionFields, stubLiquidityServiceEndpoint } from '~/playwright/fixtures/liquidityService'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'

const test = getTest({ withAnvil: true })

const V3_POSITION_MANAGER = CHAIN_TO_ADDRESSES_MAP[UniverseChainId.Mainnet].nonfungiblePositionManagerAddress!

// The representative LP operation: a liquidity-service encoded action signed through SignTransaction.
test.describe(
  'Claim fees via embedded wallet',
  {
    tag: '@team:apps-infra',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-infra' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('collects v3 fees with one embedded wallet transaction signature', async ({ page, anvil }) => {
      // The collect executes on the fork, so the test wallet must own the position; the live position
      // read is patched to agree so the ownership-gated action renders.
      const liveOwner = await transferPositionToTestWallet({
        anvil,
        positionManager: V3_POSITION_MANAGER,
        tokenId: LIVE_V3_TOKEN_ID,
      })
      await stubGetPositionFields({ page })
      const embeddedWallet = await setupEmbeddedWallet(page)
      // ClaimFees simulates the collect on live mainnet as walletAddress and rejects a non-owner, so request
      // as the live owner and hand `from` back to the test wallet, which owns the position on the fork.
      // Collecting as WETH skips the unwrap/sweep minimums the service derives from live fees the fork lacks.
      await stubLiquidityServiceEndpoint({
        page,
        endpoint: LiquidityService.methods.claimFees,
        service: LiquidityService,
        modifyRequestData: (data) => ({ ...data, walletAddress: liveOwner, collectAsWeth: true }),
        modifyResponseData: (data) =>
          data?.claim ? { ...data, claim: { ...data.claim, from: TEST_WALLET_ADDRESS } } : data,
      })
      const expectSingleTransaction = createExpectSingleTransaction({
        anvil,
        address: TEST_WALLET_ADDRESS,
        options: { blocks: 2 },
      })

      await page.goto(`/positions/v3/ethereum/${LIVE_V3_TOKEN_ID}?${EMBEDDED_WALLET_URL_PARAMS}`)

      // Hold the collect in the mempool so the pending state is observable.
      await anvil.setAutomine(false)
      await expectSingleTransaction(async () => {
        await page.getByRole('button', { name: 'Collect fees' }).click()
        await page.getByTestId(TestID.ClaimFees).click()
        await expect(page.getByTestId(TestID.ActivityPopup).getByText('Collecting fees')).toBeVisible()
      })

      expect(rpcSequence(embeddedWallet)).toEqual([
        'Challenge:WALLET_SIGNIN',
        'WalletSignIn',
        'Challenge:SIGN_TRANSACTION',
        'SignTransaction',
      ])
      expect(embeddedWallet.signedTransactions).toHaveLength(1)
      const signRequest = embeddedWallet.rpcCalls.find((call) => call.rpc === 'SignTransaction')
      const requestedTx = JSON.parse(String(signRequest?.body.transaction)) as { to: string }
      expect(areEvmAddressesEqual(requestedTx.to, V3_POSITION_MANAGER)).toBe(true)

      // The signed bytes the mock returned are the transaction anvil mined. viem throws on an unknown
      // hash, so turn that into the assertion it stands for.
      const signedTxHash = keccak256(embeddedWallet.signedTransactions[0])
      const receipt = await anvil.getTransactionReceipt({ hash: signedTxHash }).catch(() => undefined)
      expect(receipt, `anvil did not mine the transaction the embedded wallet signed (${signedTxHash})`).toBeDefined()
      expect(receipt?.status).toBe('success')
    })
  },
)
