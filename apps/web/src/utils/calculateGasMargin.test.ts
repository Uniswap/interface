import { BigNumber } from '@ethersproject/bignumber'
import { calculateGasMargin } from 'utils/calculateGasMargin'

describe('#calculateGasMargin', () => {
  it('adds 100% (2.0x multiplier)', () => {
    expect(calculateGasMargin(BigNumber.from(1000)).toString()).toEqual('2000')
    expect(calculateGasMargin(BigNumber.from(50)).toString()).toEqual('100')
  })
})
