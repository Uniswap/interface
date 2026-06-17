import { JsonRpcProvider } from '@ethersproject/providers'
import { encodeFunctionResult } from 'viem'
import { describe, expect, it, vi } from 'vitest'
import { feeOnTransferDetectorAbi } from '../../abis/feeOnTransferDetectorAbi'
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
