import type { Abi } from 'viem'
import { encodeAbiParameters, parseAbi } from 'viem'
import { describe, expect, it } from 'vitest'
import { createDecodeFunctionResult } from './createDecodeFunctionResult'

const abi = parseAbi([
  'function name() view returns (string)',
  'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, bool unlocked)',
])

const ethersDecode = createDecodeFunctionResult({ getViemEnabled: () => false })
const viemDecode = createDecodeFunctionResult({ getViemEnabled: () => true })

describe('decodeFunctionResult', () => {
  // viem unwraps single-output functions and returns the value directly.
  // Our chains seam matches that shape on the ethers branch too.
  it('agree on single-output: returns the value directly (no [0])', () => {
    const data = encodeAbiParameters([{ type: 'string' }], ['Wrapped Ether'])
    expect(ethersDecode({ abi, functionName: 'name', data })).toEqual('Wrapped Ether')
    expect(viemDecode({ abi, functionName: 'name', data })).toEqual('Wrapped Ether')
  })

  // For multi-output functions both branches return a positional array.
  // ethers' native `Result` also has named accessors; we strip those by
  // spreading into a plain array so consumers can't depend on named access.
  it('agree on multi-output: returns a positional array', () => {
    const data = encodeAbiParameters([{ type: 'uint160' }, { type: 'int24' }, { type: 'bool' }], [123n, 456, true])
    expect(ethersDecode({ abi, functionName: 'slot0', data })).toEqual([123n, 456, true])
    expect(viemDecode({ abi, functionName: 'slot0', data })).toEqual([123n, 456, true])
  })

  // Real-world ABI shapes the migrated call sites actually
  // pass in. ERC20 fragments and V3 pool mirrors those sites.
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

    it('ERC20 name() decodes string directly (no [0])', () => {
      const data = encodeAbiParameters([{ type: 'string' }], ['Wrapped Ether'])
      expect(ethersDecode({ abi: ERC20_FRAGMENTS, functionName: 'name', data })).toEqual('Wrapped Ether')
      expect(viemDecode({ abi: ERC20_FRAGMENTS, functionName: 'name', data })).toEqual('Wrapped Ether')
    })

    it('ERC20 symbol() decodes string directly (no [0])', () => {
      const data = encodeAbiParameters([{ type: 'string' }], ['WETH'])
      expect(ethersDecode({ abi: ERC20_FRAGMENTS, functionName: 'symbol', data })).toEqual('WETH')
      expect(viemDecode({ abi: ERC20_FRAGMENTS, functionName: 'symbol', data })).toEqual('WETH')
    })

    // uint8 <= 48 bits, so both libraries return a plain `number`
    // (no BigNumber/bigint conversion needed). The `parseInt` assertion
    // documents the legacy raw-hex parse used in for `decimals`.
    it('ERC20 decimals() decodes uint8 as number on both branches', () => {
      const data = encodeAbiParameters([{ type: 'uint8' }], [18])
      expect(parseInt(data)).toEqual(18)
      expect(ethersDecode({ abi: ERC20_FRAGMENTS, functionName: 'decimals', data })).toEqual(18)
      expect(viemDecode({ abi: ERC20_FRAGMENTS, functionName: 'decimals', data })).toEqual(18)
    })

    // Real V3 slot0 returns: uint160 (bigint), int24 (number), 3x uint16
    // (number), uint8 (number), bool. Exercises the BigNumber -> bigint
    // normalization on the uint160 and confirms small ints stay numeric.
    it('V3 slot0() decodes to a fully-typed positional tuple', () => {
      const SQRT_PRICE_X96 = 79228162514264337593543950336n // 1.0 in Q64.96
      const data = encodeAbiParameters(
        [
          { type: 'uint160' },
          { type: 'int24' },
          { type: 'uint16' },
          { type: 'uint16' },
          { type: 'uint16' },
          { type: 'uint8' },
          { type: 'bool' },
        ],
        [SQRT_PRICE_X96, -42, 1, 1, 1, 0, true],
      )
      const expected = [SQRT_PRICE_X96, -42, 1, 1, 1, 0, true]
      expect(ethersDecode({ abi: V3_POOL_SLOT0_FRAGMENT, functionName: 'slot0', data })).toEqual(expected)
      expect(viemDecode({ abi: V3_POOL_SLOT0_FRAGMENT, functionName: 'slot0', data })).toEqual(expected)
    })
  })
})
