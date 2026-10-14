import { MERKLE_DISTRIBUTOR_ADDRESS } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { assume0xAddress, parseEther } from '~/chains'
import { expect, getTest } from '~/playwright/fixtures'
import { getVisibleDropdownElementByTestId } from '~/playwright/fixtures/utils'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'

const test = getTest({ withAnvil: true })

// Permissive runtime bytecode: returns 32
// zero bytes for any call, never reverts.
const PERMISSIVE_DISTRIBUTOR_BYTECODE = '0x60206000f3'

// The app loads claim allocations (index/amount/proof) from this GitHub repo.
const CLAIM_DATA_URL = '**/mrkl-drop-data-chunks/**'

// Exercises the claim write
test.describe(
  'Claim UNI',
  {
    tag: '@team:apps-portfolio',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-portfolio' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test.describe.configure({ retries: 3 })

    test('submits a claim transaction through the chains seam', async ({ page, anvil }) => {
      const distributor = assume0xAddress(MERKLE_DISTRIBUTOR_ADDRESS[UniverseChainId.Mainnet])

      // Stub the distributor so `isClaimed` is false and `claim` cannot revert
      await anvil.setCode({ address: distributor, bytecode: PERMISSIVE_DISTRIBUTOR_BYTECODE })
      await anvil.setBalance({ address: TEST_WALLET_ADDRESS, value: parseEther('10') })
      // Serve a fabricated allocation for the connected test wallet. The mapping
      // file resolves any address to a single chunk; the chunk holds the claim.
      await page.route(CLAIM_DATA_URL, async (route) => {
        const isMapping = route.request().url().endsWith('mapping.json')
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify(
            isMapping
              ? { [TEST_WALLET_ADDRESS]: TEST_WALLET_ADDRESS }
              : {
                  [TEST_WALLET_ADDRESS]: {
                    index: 0,
                    amount: '1000000000000000000000', // 1,000 UNI
                    proof: ['0x0000000000000000000000000000000000000000000000000000000000000000'],
                  },
                },
          ),
        })
      })

      await page.goto('/swap')
      await page.getByTestId(TestID.Web3StatusConnected).click()
      const drawer = getVisibleDropdownElementByTestId(page, TestID.AccountDrawer)
      await drawer.getByTestId(TestID.AccountDrawerClaimReward).click()
      // Modal pre-fills connected wallet; captures the nonce, then submits.
      const nonceBefore = await anvil.getTransactionCount({ address: TEST_WALLET_ADDRESS })
      await page.getByTestId(TestID.ClaimUni).click()

      await expect(page.getByTestId(TestID.ClaimUniStatus)).toBeVisible()
      await expect
        .poll(() => anvil.getTransactionCount({ address: TEST_WALLET_ADDRESS }), { timeout: 30_000 })
        .toBeGreaterThan(nonceBefore)
    })
  },
)
