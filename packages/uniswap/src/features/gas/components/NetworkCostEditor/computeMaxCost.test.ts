import { BigNumber } from '@ethersproject/bignumber'
import {
  computeMaxCost,
  computeMaxCostFromTx,
} from 'uniswap/src/features/gas/components/NetworkCostEditor/computeMaxCost'
import { addGwei, gweiToWei } from 'uniswap/src/features/gas/components/NetworkCostEditor/gweiToWei'

describe('computeMaxCostFromTx', () => {
  it('returns maxFeePerGas * gasLimit in wei', () => {
    // 100 GWEI maxFeePerGas * 21000 gasLimit = 2.1e15 wei
    expect(computeMaxCostFromTx({ maxFeePerGas: '100000000000', gasLimit: '21000' })).toBe('2100000000000000')
  })

  it('accepts BigNumber and number inputs', () => {
    expect(computeMaxCostFromTx({ maxFeePerGas: BigNumber.from('100000000000'), gasLimit: 21000 })).toBe(
      '2100000000000000',
    )
  })

  it('accepts hex-string inputs', () => {
    // 0x174876e800 = 100000000000, 0x5208 = 21000
    expect(computeMaxCostFromTx({ maxFeePerGas: '0x174876e800', gasLimit: '0x5208' })).toBe('2100000000000000')
  })

  it('matches computeMaxCost for the same applied override (base+priority composed into maxFeePerGas)', () => {
    // Editor: (3 + 2) GWEI * 100000. Tx after override: maxFeePerGas = 5 GWEI, gasLimit = 100000.
    const editor = computeMaxCost({ maxBaseFeeGwei: '3', priorityFeeGwei: '2', gasLimit: '100000' })
    const row = computeMaxCostFromTx({ maxFeePerGas: '5000000000', gasLimit: '100000' })
    expect(row).toBe(editor)
  })

  it('agrees with the production override→tx composition (gweiToWei + addGwei) and the editor formula', () => {
    // End-to-end parity guard against drift in either helper: the wire
    // maxFeePerGas is composed as `gweiToWei(addGwei(maxBase, priority))`, echoed
    // onto the tx, then read back by `computeMaxCostFromTx`. The result must equal
    // the editor's `computeMaxCost` over the same GWEI inputs. Decimals exercise
    // the rounding path.
    const maxBaseFeeGwei = '3.21'
    const priorityFeeGwei = '6.05'
    const gasLimit = '169698'
    const editor = computeMaxCost({ maxBaseFeeGwei, priorityFeeGwei, gasLimit })
    const maxFeePerGas = gweiToWei(addGwei(maxBaseFeeGwei, priorityFeeGwei))
    expect(computeMaxCostFromTx({ maxFeePerGas, gasLimit })).toBe(editor)
  })

  it('handles mainnet-scale values without precision loss', () => {
    // 120 GWEI maxFeePerGas * 500_000 gas = 6e16 wei
    expect(computeMaxCostFromTx({ maxFeePerGas: '120000000000', gasLimit: '500000' })).toBe('60000000000000000')
  })

  it('returns undefined when either field is missing', () => {
    expect(computeMaxCostFromTx({ maxFeePerGas: '100000000000', gasLimit: undefined })).toBeUndefined()
    expect(computeMaxCostFromTx({ maxFeePerGas: undefined, gasLimit: '21000' })).toBeUndefined()
    expect(computeMaxCostFromTx({ maxFeePerGas: null, gasLimit: null })).toBeUndefined()
  })

  it('returns undefined for unparseable input', () => {
    expect(computeMaxCostFromTx({ maxFeePerGas: 'not-a-number', gasLimit: '21000' })).toBeUndefined()
  })
})

describe('computeMaxCost', () => {
  it('returns (maxBaseFee + priorityFee) * gasLimit in wei', () => {
    // 3 + 2 = 5 GWEI, * 100000 gasLimit = 500000 GWEI = 5e14 wei
    expect(computeMaxCost({ maxBaseFeeGwei: '3', priorityFeeGwei: '2', gasLimit: '100000' })).toBe('500000000000000')
  })

  it('handles decimal GWEI inputs', () => {
    const result = computeMaxCost({ maxBaseFeeGwei: '3.21', priorityFeeGwei: '6.05', gasLimit: '169698' })
    expect(result).toMatch(/^\d+$/)
    expect(BigInt(result!) > BigInt('1500000000000000')).toBe(true)
    expect(BigInt(result!) < BigInt('1600000000000000')).toBe(true)
  })

  it('handles thousands separators (commas) in gasLimit', () => {
    expect(computeMaxCost({ maxBaseFeeGwei: '5', priorityFeeGwei: '0', gasLimit: '100,000' })).toBe('500000000000000')
  })

  it('returns undefined when any input is missing or invalid', () => {
    expect(computeMaxCost({ maxBaseFeeGwei: '', priorityFeeGwei: '2', gasLimit: '100000' })).toBeUndefined()
    expect(computeMaxCost({ maxBaseFeeGwei: 'abc', priorityFeeGwei: '2', gasLimit: '100000' })).toBeUndefined()
    expect(computeMaxCost({ maxBaseFeeGwei: '3', priorityFeeGwei: '2', gasLimit: '' })).toBeUndefined()
  })
})
