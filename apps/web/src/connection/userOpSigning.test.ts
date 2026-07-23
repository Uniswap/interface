import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { signTypedDataWithPasskey } from 'uniswap/src/features/passkey/embeddedWallet'
import { checkEmbeddedWalletDelegation } from 'uniswap/src/features/passkey/embeddedWalletDelegation'
import { sign7702AuthorizationWithPasskey } from 'uniswap/src/features/passkey/signing'
import { encodeCaliburUserOpSignature } from 'uniswap/src/features/smartWallet/userOp/caliburSignature'
import type { PublicClient } from 'viem'
import type { RpcUserOperation } from 'viem/account-abstraction'
import { signUserOpWithEmbeddedWallet } from '~/connection/userOpSigning'

vi.mock('uniswap/src/features/passkey/embeddedWallet', () => ({ signTypedDataWithPasskey: vi.fn() }))
vi.mock('uniswap/src/features/passkey/embeddedWalletDelegation', () => ({ checkEmbeddedWalletDelegation: vi.fn() }))
vi.mock('uniswap/src/features/passkey/signing', () => ({ sign7702AuthorizationWithPasskey: vi.fn() }))

const mockSignTypedData = vi.mocked(signTypedDataWithPasskey)
const mockCheckDelegation = vi.mocked(checkEmbeddedWalletDelegation)
const mockSign7702 = vi.mocked(sign7702AuthorizationWithPasskey)

const WALLET_ADDRESS = '0x1111111111111111111111111111111111111111'
const CALIBUR_ADDRESS = '0x2222222222222222222222222222222222222222'
const WALLET_ID = 'wallet-123'
// A 65-byte ECDSA signature (r || s || v), the shape Privy returns.
const PASSKEY_SIGNATURE = `0x${'11'.repeat(65)}` as const

const RPC_USER_OP: RpcUserOperation<'0.8'> = {
  sender: WALLET_ADDRESS,
  nonce: '0x0',
  callData: '0x',
  callGasLimit: '0x5208',
  verificationGasLimit: '0x5208',
  preVerificationGas: '0x5208',
  maxFeePerGas: '0x3b9aca00',
  maxPriorityFeePerGas: '0x3b9aca00',
  signature: '0x',
}

const publicClient = {
  getTransactionCount: vi.fn().mockResolvedValue(7),
} as unknown as PublicClient

function sign(
  overrides?: Partial<Parameters<typeof signUserOpWithEmbeddedWallet>[0]>,
): ReturnType<typeof signUserOpWithEmbeddedWallet> {
  return signUserOpWithEmbeddedWallet({
    rpcUserOp: RPC_USER_OP,
    address: WALLET_ADDRESS,
    chainId: UniverseChainId.Mainnet,
    walletId: WALLET_ID,
    publicClient,
    ...overrides,
  })
}

describe('signUserOpWithEmbeddedWallet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSignTypedData.mockResolvedValue(PASSKEY_SIGNATURE)
    // Already delegated → no authorization needed.
    mockCheckDelegation.mockResolvedValue(null)
  })

  it('signs the PackedUserOperation typed data and wraps it in the Calibur envelope', async () => {
    const result = await sign()

    expect(mockSignTypedData).toHaveBeenCalledTimes(1)
    // Privy receives serialized typed data (a JSON string), plus the walletId.
    const [typedDataArg, walletIdArg] = mockSignTypedData.mock.calls[0] ?? []
    expect(typeof typedDataArg).toBe('string')
    expect(JSON.parse(typedDataArg as string)).toMatchObject({ primaryType: 'PackedUserOperation' })
    expect(walletIdArg).toBe(WALLET_ID)

    expect(result.signature).toBe(encodeCaliburUserOpSignature(PASSKEY_SIGNATURE))
    expect(result.eip7702Auth).toBeUndefined()
    // Other userOp fields are preserved.
    expect(result.sender).toBe(RPC_USER_OP.sender)
    expect(result.callData).toBe(RPC_USER_OP.callData)
  })

  it('throws when the passkey returns no signature', async () => {
    mockSignTypedData.mockResolvedValue(undefined)
    await expect(sign()).rejects.toThrow('Embedded wallet returned no UserOp signature')
  })

  it('signs and attaches a 7702 authorization when the wallet needs delegation', async () => {
    mockCheckDelegation.mockResolvedValue({
      needsDelegation: true,
      contractAddress: CALIBUR_ADDRESS,
    } as Awaited<ReturnType<typeof checkEmbeddedWalletDelegation>>)
    mockSign7702.mockResolvedValue({
      contractAddress: CALIBUR_ADDRESS,
      chainId: UniverseChainId.Mainnet,
      nonce: 7,
      r: `0x${'33'.repeat(32)}`,
      s: `0x${'44'.repeat(32)}`,
      yParity: 0,
    } as Awaited<ReturnType<typeof sign7702AuthorizationWithPasskey>>)

    const result = await sign()

    // Authorization nonce comes from the EOA tx count, not the userOp nonce.
    expect(publicClient.getTransactionCount).toHaveBeenCalledWith({ address: WALLET_ADDRESS })
    expect(mockSign7702).toHaveBeenCalledWith({
      contractAddress: CALIBUR_ADDRESS,
      chainId: UniverseChainId.Mainnet,
      nonce: 7,
      walletId: WALLET_ID,
    })
    expect(result.eip7702Auth?.address).toBe(CALIBUR_ADDRESS)
  })

  it('reuses a caller-supplied eip7702Auth without re-checking delegation', async () => {
    const existingAuth: NonNullable<RpcUserOperation<'0.8'>['eip7702Auth']> = {
      address: CALIBUR_ADDRESS,
      chainId: '0x1',
      nonce: '0x0',
      r: `0x${'55'.repeat(32)}`,
      s: `0x${'66'.repeat(32)}`,
      yParity: '0x0',
    }

    const result = await sign({ rpcUserOp: { ...RPC_USER_OP, eip7702Auth: existingAuth } })

    expect(mockCheckDelegation).not.toHaveBeenCalled()
    expect(mockSign7702).not.toHaveBeenCalled()
    expect(result.eip7702Auth).toEqual(existingAuth)
  })
})
