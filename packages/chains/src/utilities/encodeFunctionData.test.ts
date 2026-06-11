import type { Abi } from 'viem'
import { parseAbi } from 'viem'
import { describe, expect, it } from 'vitest'
import { createEncodeFunctionData } from './createEncodeFunctionData'

const abi = parseAbi([
  'function name() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)',
])

const ethersEncode = createEncodeFunctionData({ getViemEnabled: () => false })
const viemEncode = createEncodeFunctionData({ getViemEnabled: () => true })

describe('encodeFunctionData', () => {
  it('agree on no-arg call selectors', () => {
    expect(ethersEncode({ abi, functionName: 'name' })).toEqual(viemEncode({ abi, functionName: 'name' }))
    expect(ethersEncode({ abi, functionName: 'name' })).toEqual('0x06fdde03')
  })

  it('agree on args after the selector', () => {
    const args = ['0x0000000000000000000000000000000000000001', 42n] as const
    const ethers = ethersEncode({ abi, functionName: 'transfer', args })
    const viem = viemEncode({ abi, functionName: 'transfer', args })
    expect(ethers).toEqual(viem)
    expect(ethers.startsWith('0xa9059cbb')).toBe(true)
  })

  // Real-world ABI shapes consumers actually call us with. ERC20 fragments
  // and V3 pool. Both are JsonFragment-typed, verifies the branches agree.
  describe('real-world ABIs (parity)', () => {
    const ERC20_FRAGMENTS = [
      {
        constant: true,
        inputs: [],
        name: 'name',
        outputs: [{ name: '', type: 'string' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'symbol',
        outputs: [{ name: '', type: 'string' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'decimals',
        outputs: [{ name: '', type: 'uint8' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
    ] as const satisfies Abi

    const V3_POOL_SLOT0_FRAGMENT = [
      {
        inputs: [],
        name: 'slot0',
        outputs: [
          { internalType: 'uint160', name: 'sqrtPriceX96', type: 'uint160' },
          { internalType: 'int24', name: 'tick', type: 'int24' },
          { internalType: 'uint16', name: 'observationIndex', type: 'uint16' },
          { internalType: 'uint16', name: 'observationCardinality', type: 'uint16' },
          { internalType: 'uint16', name: 'observationCardinalityNext', type: 'uint16' },
          { internalType: 'uint8', name: 'feeProtocol', type: 'uint8' },
          { internalType: 'bool', name: 'unlocked', type: 'bool' },
        ],
        stateMutability: 'view',
        type: 'function',
      },
    ] as const satisfies Abi

    it.each([
      ['name', '0x06fdde03'],
      ['symbol', '0x95d89b41'],
      ['decimals', '0x313ce567'],
    ] as const)('ERC20 %s() encodes to %s on both branches', (functionName, expected) => {
      const ethers = ethersEncode({ abi: ERC20_FRAGMENTS, functionName })
      const viem = viemEncode({ abi: ERC20_FRAGMENTS, functionName })
      expect(ethers).toEqual(viem)
      expect(ethers).toEqual(expected)
    })

    it('V3 pool slot0() encodes to 0x3850c7bd on both branches', () => {
      const ethers = ethersEncode({ abi: V3_POOL_SLOT0_FRAGMENT, functionName: 'slot0' })
      const viem = viemEncode({ abi: V3_POOL_SLOT0_FRAGMENT, functionName: 'slot0' })
      expect(ethers).toEqual(viem)
      expect(ethers).toEqual('0x3850c7bd')
    })
  })
})
