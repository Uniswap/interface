import type { JsonRpcProvider, JsonRpcSigner } from '@ethersproject/providers'
import { createPublicClient, custom, encodeFunctionResult } from 'viem'
import { mainnet } from 'viem/chains'
import { describe, expect, it, vi } from 'vitest'
import { feeOnTransferDetectorAbi } from '../../abis/feeOnTransferDetectorAbi'
import { createViemContract, createViemContractFromEthersParams } from './viem'

// Fixture matched 1:1 with ethers tests. Both tests decode the same
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
const zeroAccount = '0x0000000000000000000000000000000000000000'

const encodedResult = encodeFunctionResult({
  abi: feeOnTransferDetectorAbi,
  functionName: 'batchValidate',
  result: expectedFees,
})

function makePublicClient() {
  return createPublicClient({
    chain: mainnet,
    transport: custom({
      request: async ({ method }) => {
        if (method === 'eth_call') {
          return encodedResult
        }
        if (method === 'eth_chainId') {
          return '0x1'
        }
        throw new Error(`Unexpected RPC method: ${method}`)
      },
    }),
  })
}

describe('createViemContract', () => {
  it('decodes batchValidate eth_call bytes into the expected struct array', async () => {
    const contract = createViemContract({
      address: detectorAddress,
      abi: feeOnTransferDetectorAbi,
      publicClient: makePublicClient(),
    })
    const { result } = await contract.simulate.batchValidate([[tokenA, tokenB], baseToken, amount], {
      account: zeroAccount,
    })
    expect(result).toEqual(expectedFees)
  })

  // Viem's `getContract` only attaches `.write` when a walletClient
  // is supplied, so calling it without one throws synchronously.
  it('throws at runtime when calling .write without a walletClient', () => {
    const contract = createViemContract({
      address: detectorAddress,
      abi: feeOnTransferDetectorAbi,
      publicClient: makePublicClient(),
    })
    expect(() =>
      contract.write.batchValidate([[tokenA, tokenB], baseToken, amount], {
        account: zeroAccount,
        chain: mainnet,
      }),
    ).toThrow()
  })
})

describe('createViemContractFromEthersParams', () => {
  it('routes eth_call through the ethers provider and decodes via viem', async () => {
    const send = vi.fn(async (method: string) => {
      if (method === 'eth_call') {
        return encodedResult
      }
      if (method === 'eth_chainId') {
        return '0x1'
      }
      throw new Error(`Unexpected RPC method: ${method}`)
    })
    const provider = { send } as unknown as JsonRpcProvider
    const contract = createViemContractFromEthersParams({
      address: detectorAddress,
      abi: feeOnTransferDetectorAbi,
      provider,
    })
    const { result } = await contract.simulate.batchValidate([[tokenA, tokenB], baseToken, amount], {
      account: zeroAccount,
    })
    expect(result).toEqual(expectedFees)
    // The eth_call went through the ethers provider's send.
    expect(send).toHaveBeenCalledWith('eth_call', expect.any(Array))
  })

  it('attaches the wallet surface only when signer + signerAddress are supplied', () => {
    const provider = { send: vi.fn() } as unknown as JsonRpcProvider
    const signer = { provider } as unknown as JsonRpcSigner
    const signerAddress = '0xCD2A3d9F938E13CD947Ec05Abc7FE734DF8DD826' as const
    const withSigner = createViemContractFromEthersParams({
      address: detectorAddress,
      abi: feeOnTransferDetectorAbi,
      provider,
      signer,
      signerAddress,
    })
    const withoutSigner = createViemContractFromEthersParams({
      address: detectorAddress,
      abi: feeOnTransferDetectorAbi,
      provider,
    })
    // Viem only attaches `.write` when a walletClient is present, runtime
    // evidence that the signer+signerAddress branch actually built one.
    // It's not the most "direct" but less brittle then internal checks.
    expect((withSigner as { write?: unknown }).write).toBeDefined()
    expect((withoutSigner as { write?: unknown }).write).toBeUndefined()
  })
})
