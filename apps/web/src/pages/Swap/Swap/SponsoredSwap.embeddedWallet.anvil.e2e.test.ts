import { WETH_ADDRESS } from '@uniswap/universal-router-sdk'
import { TradingApi, V1_TRADING_API_PATHS } from '@universe/api'
import { areEvmAddressesEqual, entryPoint08Address, type RpcUserOperation, UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { USDC } from 'uniswap/src/constants/tokens'
import { encodeCaliburUserOpSignature } from 'uniswap/src/features/smartWallet/userOp/caliburSignature'
import { formatUserOperation, getUserOperationTypedData } from 'viem/account-abstraction'
import { assume0xAddress } from '~/chains'
import { expect, getTest } from '~/playwright/fixtures'
import { EMBEDDED_WALLET_URL_PARAMS, rpcSequence, setupEmbeddedWallet } from '~/playwright/fixtures/embeddedWallet'
import { submitSwapForm } from '~/playwright/fixtures/swapForm'
import {
  getTradingApiEndpointPattern,
  mockTradingApiSwapsStatus,
  stubTradingApiEndpoint,
} from '~/playwright/fixtures/tradingApi'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'

const test = getTest({ withAnvil: true })

const CHAIN_ID = UniverseChainId.Mainnet
const WETH = assume0xAddress(WETH_ADDRESS(CHAIN_ID))

const SPONSORED_CALL = { to: WETH, data: '0xd0e30db0', value: '0x2386f26fc10000' } // deposit(), 0.01 ETH
const PAYMASTER_SERVICE = {
  url: 'https://unirpc.uniswap.org/paymaster/v1/1',
  context: { sponsorship: 'e2e-sponsorship-blob', policyId: 'e2e-policy' },
}

const UNSIGNED_USER_OP: RpcUserOperation<'0.8'> = {
  sender: TEST_WALLET_ADDRESS,
  nonce: '0x0',
  callData: '0xe9ae5c53',
  callGasLimit: '0x186a0',
  verificationGasLimit: '0x186a0',
  preVerificationGas: '0xc350',
  maxFeePerGas: '0x174876e800',
  maxPriorityFeePerGas: '0x3b9aca00',
  paymaster: '0x2222222222222222222222222222222222222222',
  paymasterVerificationGasLimit: '0x186a0',
  paymasterPostOpGasLimit: '0x186a0',
  paymasterData: `0x${'33'.repeat(32)}`,
  // The encoder returns a dummy placeholder the wallet replaces; empty hex is rejected by the transform.
  signature: `0x${'ff'.repeat(65)}`,
}
const USER_OP_HASH = `0x${'aa'.repeat(32)}`
const BUNDLED_TX_HASH = `0x${'bb'.repeat(32)}`

interface BundlerRequest {
  method: string
  params: [RpcUserOperation<'0.8'>, string]
}

// Gas abstraction: a sponsored swap goes /swap_5792 -> wallet_sendCalls -> encode_4337 -> SignTypedData
// over the PackedUserOperation -> Calibur envelope -> bundler. The client's job ends at the bundler, so
// the encoder and bundler are stubbed and the assertions check request shapes and signature bytes.
test.describe(
  'Sponsored swap via embedded wallet',
  {
    tag: '@team:apps-infra',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-infra' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('signs the sponsored user operation and submits it to the bundler', async ({ page, anvil }) => {
      const embeddedWallet = await setupEmbeddedWallet(page)

      await stubTradingApiEndpoint({
        page,
        endpoint: V1_TRADING_API_PATHS.quote,
        modifyRequestData: (data) =>
          data.routingPreference === TradingApi.RoutingPreference.FASTEST
            ? data
            : { ...data, protocols: [TradingApi.ProtocolItems.V2, TradingApi.ProtocolItems.V3] },
        modifyResponseData: (data) => ({
          ...data,
          sponsorshipInfo: { sponsored: true, sponsorMetadata: { name: 'Uniswap Labs' } },
        }),
      })

      await page.route(getTradingApiEndpointPattern(V1_TRADING_API_PATHS.swap5792), async (route) => {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            requestId: 'e2e-swap-5792',
            from: TEST_WALLET_ADDRESS,
            chainId: CHAIN_ID,
            calls: [SPONSORED_CALL],
            gasFee: '0',
            paymasterService: PAYMASTER_SERVICE,
          }),
        })
      })

      const encodeRequests: Record<string, unknown>[] = []
      await page.route(getTradingApiEndpointPattern(V1_TRADING_API_PATHS.wallet.encode4337), async (route) => {
        encodeRequests.push(route.request().postDataJSON() as Record<string, unknown>)
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ requestId: 'e2e-encode-4337', gasSponsored: true, userOperation: UNSIGNED_USER_OP }),
        })
      })

      // /rpc/<chainId> is shared with chain reads, so only the user-operation submission is intercepted.
      const bundlerRequests: BundlerRequest[] = []
      await page.route(`**/rpc/${CHAIN_ID}`, async (route) => {
        const body = route.request().postDataJSON() as { id: number; method?: string } | undefined
        if (body?.method !== 'eth_sendUserOperation') {
          await route.fallback()
          return
        }
        bundlerRequests.push(body as unknown as BundlerRequest)
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ jsonrpc: '2.0', id: body.id, result: USER_OP_HASH }),
        })
      })

      // The batch poller resolves the userOpHash through /swaps.
      await mockTradingApiSwapsStatus({ page, hashType: 'USER_OP', txHash: BUNDLED_TX_HASH })

      const initialEthBalance = await anvil.getBalance({ address: TEST_WALLET_ADDRESS })

      await page.goto(`/swap?inputCurrency=ETH&outputCurrency=${USDC.address}&${EMBEDDED_WALLET_URL_PARAMS}`)
      await submitSwapForm({ page, amount: '0.01' })

      await expect.poll(() => bundlerRequests.length, { timeout: 30_000 }).toBe(1)
      await expect(page.getByTestId(TestID.ActivityPopup).getByText('Swapped')).toBeVisible()

      // The bundler owns submission; the client broadcast nothing.
      expect(await anvil.getBalance({ address: TEST_WALLET_ADDRESS })).toBe(initialEthBalance)
      expect(embeddedWallet.signedTransactions).toHaveLength(0)
      expect(embeddedWallet.signed7702Transactions).toHaveLength(0)

      expect(encodeRequests).toHaveLength(1)
      const encodeRequest = encodeRequests[0]
      expect(encodeRequest.calls).toEqual([SPONSORED_CALL])
      expect(areEvmAddressesEqual(String(encodeRequest.sender), TEST_WALLET_ADDRESS)).toBe(true)
      expect(encodeRequest.chainId).toBe(CHAIN_ID)
      expect(encodeRequest.paymasterUrl).toBe(PAYMASTER_SERVICE.url)
      expect(encodeRequest.paymasterServiceContext).toEqual(PAYMASTER_SERVICE.context)
      expect(encodeRequest.eip7702Auth).toBeUndefined()

      expect(rpcSequence(embeddedWallet)).toEqual([
        'Challenge:WALLET_SIGNIN',
        'WalletSignIn',
        'Challenge:SIGN_TYPED_DATA',
        'SignTypedData',
      ])
      expect(embeddedWallet.signedTypedData).toHaveLength(1)
      const signed = embeddedWallet.signedTypedData[0]
      expect(signed.typedData.primaryType).toBe('PackedUserOperation')
      expect(areEvmAddressesEqual(signed.typedData.domain?.verifyingContract, entryPoint08Address)).toBe(true)
      expect(Number(signed.typedData.domain?.chainId)).toBe(CHAIN_ID)

      // Byte-equal to the Calibur-wrapped signature over the canonical digest, computed independently here.
      const expectedEcdsaSignature = await embeddedWallet.account.signTypedData(
        getUserOperationTypedData({
          chainId: CHAIN_ID,
          entryPointAddress: entryPoint08Address,
          userOperation: formatUserOperation(UNSIGNED_USER_OP),
        }),
      )
      const [submittedUserOp, entryPoint] = bundlerRequests[0].params
      expect(entryPoint).toBe(entryPoint08Address)
      expect(submittedUserOp.signature).toBe(encodeCaliburUserOpSignature(expectedEcdsaSignature))
      expect(submittedUserOp.sender).toBe(UNSIGNED_USER_OP.sender)
      expect(submittedUserOp.nonce).toBe(UNSIGNED_USER_OP.nonce)
      expect(submittedUserOp.callData).toBe(UNSIGNED_USER_OP.callData)
      expect(submittedUserOp.paymaster).toBe(UNSIGNED_USER_OP.paymaster)
      expect(submittedUserOp.eip7702Auth).toBeUndefined()
    })
  },
)
