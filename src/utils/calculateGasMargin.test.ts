import { BigNumber } from 'ethers'

import { calculateGasMargin } from './calculateGasMargin'

describe('#calculateGasMargin', () => {
  it('adds 20%', () => {
    expect(calculateGasMargin(BigNumber.from(1000)).toString()).toEqual('1200')
    expect(calculateGasMargin(BigNumber.from(50)).toString()).toEqual('60')
  })
})
