import { PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { DutchOrder } from '@uniswap/uniswapx-sdk'
import { V1_TRADING_API_PATHS } from '@universe/api'
import { areEvmAddressesEqual } from '@universe/chains'
import { TestID } from '@universe/test'
import { USDT } from 'uniswap/src/constants/tokens'
import { verifyTypedData } from 'viem'
import { assume0xAddress, parseEther } from '~/chains'
import { expect, getTest } from '~/playwright/fixtures'
import { EMBEDDED_WALLET_URL_PARAMS, rpcSequence, setupEmbeddedWallet } from '~/playwright/fixtures/embeddedWallet'
import { stubTradingApiEndpoint } from '~/playwright/fixtures/tradingApi'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'

const test = getTest({ withAnvil: true })

const LIMIT_AMOUNT_USDT = 100_000_000n // 100 USDT
/** The UniswapX nonce endpoint returns the last used nonce; the order is built with the next one. */
const LAST_USED_ORDER_NONCE = 41n
const ORDER_HASH = `0x${'11'.repeat(32)}`

interface LimitOrderPost {
  encodedOrder: string
  orderType: string
  signature: string
  chainId: number
}

// An off-chain Dutch order: the wallet signs a Permit2 PermitWitnessTransferFrom carrying the order as
// its witness and the app posts it to the order service. Nothing lands on anvil, so assert at that API.
test.describe(
  'Limit order via embedded wallet',
  {
    tag: '@team:apps-infra',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-infra' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('posts a limit order signed by the embedded wallet', async ({ page, anvil }) => {
      const usdtAddress = assume0xAddress(USDT.address)
      const embeddedWallet = await setupEmbeddedWallet(page)
      await stubTradingApiEndpoint({ page, endpoint: V1_TRADING_API_PATHS.quote })

      const orderPosts: LimitOrderPost[] = []
      await page.route('**/nonce?*', async (route) => {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ nonce: LAST_USED_ORDER_NONCE.toString() }),
        })
      })
      await page.route('**/limit-order', async (route) => {
        orderPosts.push(route.request().postDataJSON() as LimitOrderPost)
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ hash: ORDER_HASH }),
        })
      })
      await page.route('**/orders?*', async (route) => {
        await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ orders: [] }) })
      })

      // Pre-approved to Permit2 so the flow goes straight to the order signature.
      await anvil.setBalance({ address: TEST_WALLET_ADDRESS, value: parseEther('10') })
      await anvil.setErc20Balance({ address: usdtAddress, balance: LIMIT_AMOUNT_USDT * 10n })
      await anvil.setErc20Allowance({ address: usdtAddress, spender: PERMIT2_ADDRESS })

      await page.goto(`/limit?inputCurrency=${USDT.address}&outputCurrency=ETH&${EMBEDDED_WALLET_URL_PARAMS}`)
      await page.getByTestId(TestID.AmountInputIn).fill('100')
      await page.getByText('+1%').click()
      await page.getByTestId(TestID.SubmitOrderButton).click()
      await page.getByTestId(TestID.ConfirmSwapButton).click()

      await expect.poll(() => orderPosts.length, { timeout: 30_000 }).toBe(1)
      const post = orderPosts[0]

      expect(rpcSequence(embeddedWallet)).toEqual([
        'Challenge:WALLET_SIGNIN',
        'WalletSignIn',
        'Challenge:SIGN_TYPED_DATA',
        'SignTypedData',
      ])
      expect(embeddedWallet.signedTransactions).toHaveLength(0)
      expect(embeddedWallet.signedTypedData).toHaveLength(1)
      const signed = embeddedWallet.signedTypedData[0]

      expect(post.signature).toBe(signed.signature)
      expect(post.orderType).toBe('Limit')
      expect(post.chainId).toBe(1)
      expect(signed.typedData.primaryType).toBe('PermitWitnessTransferFrom')
      expect(areEvmAddressesEqual(signed.typedData.domain?.verifyingContract, PERMIT2_ADDRESS)).toBe(true)
      expect(
        await verifyTypedData({
          address: TEST_WALLET_ADDRESS,
          domain: signed.typedData.domain,
          types: signed.typedData.types,
          primaryType: signed.typedData.primaryType,
          message: signed.typedData.message,
          signature: signed.signature,
        }),
      ).toBe(true)

      // The posted order and the signed permit describe the same order.
      const order = DutchOrder.parse(post.encodedOrder, 1)
      expect(areEvmAddressesEqual(order.info.swapper, TEST_WALLET_ADDRESS)).toBe(true)
      expect(areEvmAddressesEqual(order.info.input.token, USDT.address)).toBe(true)
      expect(order.info.input.startAmount.toString()).toBe(LIMIT_AMOUNT_USDT.toString())
      expect(order.info.nonce.toString()).toBe((LAST_USED_ORDER_NONCE + 1n).toString())
      const permitMessage = signed.typedData.message as {
        permitted: { token: string; amount: string }
        nonce: string
        witness: {
          info: { swapper: string }
          outputs: { token: string; startAmount: string; endAmount: string; recipient: string }[]
        }
      }
      expect(areEvmAddressesEqual(permitMessage.permitted.token, USDT.address)).toBe(true)
      expect(String(permitMessage.permitted.amount)).toBe(LIMIT_AMOUNT_USDT.toString())
      expect(String(permitMessage.nonce)).toBe(order.info.nonce.toString())
      expect(areEvmAddressesEqual(permitMessage.witness.info.swapper, order.info.swapper)).toBe(true)

      // The output leg: one output paid to the swapper with no decay (a limit order), and the witness
      // the wallet signed describes the same output the reactor will fill.
      expect(order.info.outputs).toHaveLength(1)
      const output = order.info.outputs[0]!
      const witnessOutput = permitMessage.witness.outputs[0]
      expect(areEvmAddressesEqual(output.recipient, TEST_WALLET_ADDRESS)).toBe(true)
      expect(output.startAmount.gt(0)).toBe(true)
      expect(output.endAmount.toString()).toBe(output.startAmount.toString())
      expect(areEvmAddressesEqual(witnessOutput.token, output.token)).toBe(true)
      expect(String(witnessOutput.startAmount)).toBe(output.startAmount.toString())
      expect(String(witnessOutput.endAmount)).toBe(output.endAmount.toString())
      expect(areEvmAddressesEqual(witnessOutput.recipient, output.recipient)).toBe(true)
    })
  },
)
