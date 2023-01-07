import { BigNumber } from '@ethersproject/bignumber'

import { calculateGasMargin } from './calculateGasMargin'

describe('#calculateGasMargin', () => {
  it('adds 20%', () => {
    expect(calculateGasMargin(1, BigNumber.from(1000)).toString()).toEqual('1200')
    expect(calculateGasMargin(1, BigNumber.from(50)).toString()).toEqual('60')
  })

  it('optimism - returns exact value', () => {
    expect(calculateGasMargin(69, BigNumber.from(1000)).toString()).toEqual('1000')
    expect(calculateGasMargin(69, BigNumber.from(50)).toString()).toEqual('50')
  })
})
