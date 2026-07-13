import { BigNumber } from '@ethersproject/bignumber'
import { JsonRpcProvider, type JsonRpcSigner } from '@ethersproject/providers'
import { encodeFunctionResult } from 'viem'
import { describe, expect, it, vi } from 'vitest'
import { feeOnTransferDetectorAbi } from '../../abis/feeOnTransferDetectorAbi'
import { wethAbi } from '../../abis/wethAbi'
import { createEthersContract } from './ethers'

// Fixture matched 1:1 with viem tests. Both tests decode the same
// pre-encoded `eth_call` bytes and must produce identical JS shapes.
const detectorAddress = '0x19c97dc2a25845c7f9d1d519c8c2d4809c58b43f'
const tokenA = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const tokenB = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
const baseToken = '0xcccccccccccccccccccccccccccccccccccccccc'
const amount = 10000n
const expectedFees = [
  { buyFeeBps: 100n, sellFeeBps: 50n },
  { buyFeeBps: 200n, sellFeeBps: 0n },
]

const encodedResult = encodeFunctionResult({
  abi: feeOnTransferDetectorAbi,
  functionName: 'batchValidate',
  result: expectedFees,
})

function makeMockProvider() {
  const provider = new JsonRpcProvider('http://localhost')
  vi.spyOn(provider, 'send').mockImplementation(async (method) => {
    if (method === 'eth_call') {
      return encodedResult
    }
    if (method === 'eth_chainId') {
      return '0x1'
    }
    throw new Error(`Unexpected RPC method: ${method}`)
  })
  // Pre-resolve detectNetwork so the Contract constructor doesn't
  // try to fetch chain metadata before our mock is exercised.
  Object.defineProperty(provider, '_network', { value: { chainId: 1, name: 'mainnet' } })
  Object.defineProperty(provider, '_ready', { value: () => Promise.resolve(provider.network) })
  return provider
}

describe('createEthersContract — simulate', () => {
  it('decodes batchValidate eth_call bytes into the expected struct array', async () => {
    const contract = createEthersContract({
      address: detectorAddress,
      abi: feeOnTransferDetectorAbi,
      provider: makeMockProvider(),
    })
    const { result } = await contract.simulate.batchValidate([[tokenA, tokenB], baseToken, amount])
    expect(result).toEqual(expectedFees)
  })
})

describe('createEthersContract — write', () => {
  const txHash = `0x${'34'.repeat(32)}`
  const signerAddress = '0xCD2A3d9F938E13CD947Ec05Abc7FE734DF8DD826' as const

  function makeWethWriteContract() {
    const sendTransaction = vi.fn(async () => ({ hash: txHash, wait: vi.fn() }))
    // The seam builds writes through an unchecked signer; return the same mock
    // from `connectUnchecked` so `sendTransaction` stays the spy that's called.
    const connectUnchecked = vi.fn()
    // Duck-typed: ethers' `Signer.isSigner` only checks `_isSigner`.
    const signer = {
      _isSigner: true,
      sendTransaction,
      getAddress: async () => signerAddress,
      connectUnchecked,
    } as unknown as JsonRpcSigner
    connectUnchecked.mockReturnValue(signer)
    const contract = createEthersContract({
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      abi: wethAbi,
      provider: makeMockProvider(),
      signer,
      signerAddress,
    })
    return { contract, sendTransaction, connectUnchecked }
  }

  it('forwards viem-convention options to ethers as overrides', async () => {
    const { contract, sendTransaction, connectUnchecked } = makeWethWriteContract()
    const hash = await contract.write.deposit({ value: 123n })
    expect(hash).toBe(txHash)
    // Writes must use the unchecked signer (no post-broadcast getTransaction poll).
    expect(connectUnchecked).toHaveBeenCalled()
    expect(sendTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        // deposit() selector
        data: '0xd0e30db0',
        value: BigNumber.from(123),
      }),
    )
  })

  // `chain`/`account` are per-call overrides only the viem engine honors
  it('throws on the viem-only chain/account overrides without sending', async () => {
    const { contract, sendTransaction } = makeWethWriteContract()
    await expect(contract.write.deposit({ value: 123n, chain: null })).rejects.toThrow(
      /doesn't support some write overrides/,
    )
    await expect(contract.write.withdraw([1n], { account: signerAddress })).rejects.toThrow(
      /doesn't support some write overrides/,
    )
    expect(sendTransaction).not.toHaveBeenCalled()
  })
})
