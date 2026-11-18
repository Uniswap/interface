import { UniverseChainId } from '@universe/chains'
import { sendUserOperationToBundler } from '@universe/embedded-wallet/src/connection/bundlerClient'
import {
  sendEmbeddedWalletCalls,
  type WalletSendCallsRequest,
} from '@universe/embedded-wallet/src/connection/sendCalls'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { transformTradingApiUserOpToRpcUserOp } from 'uniswap/src/features/smartWallet/userOp/transformTradingApiUserOp'
import { GasSponsorshipNotAppliedError } from 'uniswap/src/features/transactions/swap/errors'
import type { RpcUserOperation } from 'viem/account-abstraction'

vi.mock('uniswap/src/data/apiClients/tradingApi/TradingApiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/data/apiClients/tradingApi/TradingApiClient')>()
  return { ...actual, TradingApiClient: { ...actual.TradingApiClient, fetchWalletEncoding4337: vi.fn() } }
})
vi.mock('uniswap/src/features/smartWallet/userOp/transformTradingApiUserOp', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/smartWallet/userOp/transformTradingApiUserOp')>()),
  transformTradingApiUserOpToRpcUserOp: vi.fn(),
}))
vi.mock('@universe/embedded-wallet/src/connection/bundlerClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/embedded-wallet/src/connection/bundlerClient')>()),
  sendUserOperationToBundler: vi.fn(),
}))

const ACCOUNT = '0x1111111111111111111111111111111111111111'
const OTHER = '0x2222222222222222222222222222222222222222'
const TARGET = '0x3333333333333333333333333333333333333333'
const PAYMASTER = '0x0000000000000000000000000000000000000Bad'
const RPC_USER_OP = { sender: ACCOUNT, paymaster: PAYMASTER } as unknown as RpcUserOperation<'0.8'>
const UNSPONSORED_RPC_USER_OP = { sender: ACCOUNT } as unknown as RpcUserOperation<'0.8'>
const SIGNED_USER_OP = { sender: ACCOUNT, signature: '0xsig' } as unknown as RpcUserOperation<'0.8'>
const SPONSORED_CAPABILITIES = { paymasterService: { url: 'https://pm.example', context: { foo: 'bar' } } }

function mockEncode4337Response(response: { gasSponsored?: boolean; gasSponsorshipRejectionReason?: string }): void {
  vi.mocked(TradingApiClient.fetchWalletEncoding4337).mockResolvedValue({
    userOperation: {},
    ...response,
  } as unknown as Awaited<ReturnType<typeof TradingApiClient.fetchWalletEncoding4337>>)
}

function baseParams(overrides?: Partial<WalletSendCallsRequest>): WalletSendCallsRequest {
  return {
    version: '2.0.0',
    from: ACCOUNT,
    chainId: '0x1', // Mainnet
    calls: [{ to: TARGET, data: '0xabcd', value: '0x0' }],
    ...overrides,
  }
}

describe('sendEmbeddedWalletCalls', () => {
  const signUserOp = vi.fn()
  const sendTransaction = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(transformTradingApiUserOpToRpcUserOp).mockReturnValue(RPC_USER_OP)
    signUserOp.mockResolvedValue(SIGNED_USER_OP)
    vi.mocked(sendUserOperationToBundler).mockResolvedValue('0xUserOpHash')
    sendTransaction.mockResolvedValue('0xTxHash')
  })

  it('sponsored: encodes a 4337 UserOp, signs it, submits to the bundler, returns the userOpHash', async () => {
    mockEncode4337Response({ gasSponsored: true })

    const result = await sendEmbeddedWalletCalls({
      params: baseParams({ capabilities: SPONSORED_CAPABILITIES }),
      activeChainId: UniverseChainId.Mainnet,
      account: ACCOUNT,
      signUserOp,
      sendTransaction,
    })

    expect(TradingApiClient.fetchWalletEncoding4337).toHaveBeenCalledWith(
      expect.objectContaining({ sender: ACCOUNT, paymasterUrl: 'https://pm.example' }),
    )
    expect(signUserOp).toHaveBeenCalledWith(RPC_USER_OP)
    expect(sendUserOperationToBundler).toHaveBeenCalledWith(SIGNED_USER_OP, UniverseChainId.Mainnet)
    expect(sendTransaction).not.toHaveBeenCalled()
    expect(result).toEqual({ id: '0xUserOpHash' })
  })

  // SWAP-3839: the paymaster refused, encode_4337 returned an unsponsored UserOp, and the wallet used
  // to sign and send it anyway, charging gas on a swap the user was shown as free.
  describe('sponsored path never falls back to an unsponsored UserOp', () => {
    async function sendSponsored(): Promise<{ id: string }> {
      return sendEmbeddedWalletCalls({
        params: baseParams({ capabilities: SPONSORED_CAPABILITIES }),
        activeChainId: UniverseChainId.Mainnet,
        account: ACCOUNT,
        signUserOp,
        sendTransaction,
      })
    }

    function expectNothingSubmitted(): void {
      expect(signUserOp).not.toHaveBeenCalled()
      expect(sendUserOperationToBundler).not.toHaveBeenCalled()
      expect(sendTransaction).not.toHaveBeenCalled()
    }

    it('throws GasSponsorshipNotAppliedError with the rejection reason when the paymaster refuses', async () => {
      mockEncode4337Response({ gasSponsored: false, gasSponsorshipRejectionReason: 'gas price above policy cap' })
      vi.mocked(transformTradingApiUserOpToRpcUserOp).mockReturnValue(UNSPONSORED_RPC_USER_OP)

      const send = sendSponsored()
      await expect(send).rejects.toBeInstanceOf(GasSponsorshipNotAppliedError)
      await expect(send).rejects.toThrow('Gas sponsorship was not applied: gas price above policy cap')
      expectNothingSubmitted()
    })

    it('throws when the response omits gasSponsored', async () => {
      mockEncode4337Response({})

      await expect(sendSponsored()).rejects.toBeInstanceOf(GasSponsorshipNotAppliedError)
      expectNothingSubmitted()
    })

    it('throws when gasSponsored is true but the UserOp carries no paymaster', async () => {
      mockEncode4337Response({ gasSponsored: true })
      vi.mocked(transformTradingApiUserOpToRpcUserOp).mockReturnValue(UNSPONSORED_RPC_USER_OP)

      await expect(sendSponsored()).rejects.toBeInstanceOf(GasSponsorshipNotAppliedError)
      expectNothingSubmitted()
    })
  })

  it('non-sponsored: maps calls to tx params (using the connected account) and returns the tx hash', async () => {
    const result = await sendEmbeddedWalletCalls({
      params: baseParams(),
      activeChainId: UniverseChainId.Mainnet,
      account: ACCOUNT,
      signUserOp,
      sendTransaction,
    })

    expect(sendTransaction).toHaveBeenCalledWith([{ from: ACCOUNT, to: TARGET, data: '0xabcd', value: '0x0' }])
    expect(TradingApiClient.fetchWalletEncoding4337).not.toHaveBeenCalled()
    expect(result).toEqual({ id: '0xTxHash' })
  })

  it('rejects a non-hex chainId', async () => {
    await expect(
      sendEmbeddedWalletCalls({
        params: baseParams({ chainId: '1' }),
        activeChainId: UniverseChainId.Mainnet,
        account: ACCOUNT,
        signUserOp,
        sendTransaction,
      }),
    ).rejects.toThrow(/hex string/)
  })

  it('rejects when the requested chain differs from the active chain (EIP-5792 4901)', async () => {
    await expect(
      sendEmbeddedWalletCalls({
        params: baseParams({ chainId: '0xa' }), // Optimism
        activeChainId: UniverseChainId.Mainnet,
        account: ACCOUNT,
        signUserOp,
        sendTransaction,
      }),
    ).rejects.toThrow(/does not match the wallet's active chain/)
  })

  it('rejects when `from` does not match the connected account', async () => {
    await expect(
      sendEmbeddedWalletCalls({
        params: baseParams({ from: OTHER }),
        activeChainId: UniverseChainId.Mainnet,
        account: ACCOUNT,
        signUserOp,
        sendTransaction,
      }),
    ).rejects.toThrow(/does not match the connected account/)
  })
})
