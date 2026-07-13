import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { transformTradingApiUserOpToRpcUserOp } from 'uniswap/src/features/smartWallet/userOp/transformTradingApiUserOp'
import type { RpcUserOperation } from 'viem/account-abstraction'
import { sendUserOperationToBundler } from '~/connection/bundlerClient'
import { sendEmbeddedWalletCalls, type WalletSendCallsRequest } from '~/connection/sendCalls'

vi.mock('uniswap/src/data/apiClients/tradingApi/TradingApiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/data/apiClients/tradingApi/TradingApiClient')>()
  return { ...actual, TradingApiClient: { ...actual.TradingApiClient, fetchWalletEncoding4337: vi.fn() } }
})
vi.mock('uniswap/src/features/smartWallet/userOp/transformTradingApiUserOp', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/smartWallet/userOp/transformTradingApiUserOp')>()),
  transformTradingApiUserOpToRpcUserOp: vi.fn(),
}))
vi.mock('~/connection/bundlerClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/connection/bundlerClient')>()),
  sendUserOperationToBundler: vi.fn(),
}))

const ACCOUNT = '0x1111111111111111111111111111111111111111'
const OTHER = '0x2222222222222222222222222222222222222222'
const TARGET = '0x3333333333333333333333333333333333333333'
const RPC_USER_OP = { sender: ACCOUNT } as unknown as RpcUserOperation<'0.8'>
const SIGNED_USER_OP = { sender: ACCOUNT, signature: '0xsig' } as unknown as RpcUserOperation<'0.8'>

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
    vi.mocked(TradingApiClient.fetchWalletEncoding4337).mockResolvedValue({ userOperation: {} } as unknown as Awaited<
      ReturnType<typeof TradingApiClient.fetchWalletEncoding4337>
    >)

    const result = await sendEmbeddedWalletCalls({
      params: baseParams({
        capabilities: { paymasterService: { url: 'https://pm.example', context: { foo: 'bar' } } },
      }),
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
