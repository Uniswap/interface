import BigNumber from 'bignumber.js'
import getMultiplierRange from './multiplierRange'

const toBigNumber = (str: string) => new BigNumber(str)

describe('getMultiplierRange', () => {
  it('should be 0 for all empty stake', () => {
    const croStake = toBigNumber('0')
    expect(getMultiplierRange(croStake, '1')).toEqual('0.0')
    expect(getMultiplierRange(croStake, '2')).toEqual('0.0')
    expect(getMultiplierRange(croStake, '3')).toEqual('0.0')
    expect(getMultiplierRange(croStake, '4')).toEqual('0.0')
  })

  it('should be 0 for stake 1 CRO only', () => {
    const croStake = toBigNumber('1')
    expect(getMultiplierRange(croStake, '1')).toEqual('0.0')
    expect(getMultiplierRange(croStake, '2')).toEqual('0.0')
    expect(getMultiplierRange(croStake, '3')).toEqual('0.0')
    expect(getMultiplierRange(croStake, '4')).toEqual('0.0')
  })

  it('should be 0 for stake 999 CRO only', () => {
    const croStake = toBigNumber('999')
    expect(getMultiplierRange(croStake, '1')).toEqual('0.0')
    expect(getMultiplierRange(croStake, '2')).toEqual('0.0')
    expect(getMultiplierRange(croStake, '3')).toEqual('0.0')
    expect(getMultiplierRange(croStake, '4')).toEqual('0.0')
  })

  it('should not be 0 for stake 1000 CRO', () => {
    const croStake = toBigNumber('1000')
    expect(getMultiplierRange(croStake, '1')).toEqual('1.0')
    expect(getMultiplierRange(croStake, '2')).toEqual('1.2')
    expect(getMultiplierRange(croStake, '3')).toEqual('1.4')
    expect(getMultiplierRange(croStake, '4')).toEqual('2.0')
  })

  it('should not be 0 for stake 1000.01 CRO', () => {
    const croStake = toBigNumber('1000.01')
    expect(getMultiplierRange(croStake, '1')).toEqual('1.0')
    expect(getMultiplierRange(croStake, '2')).toEqual('1.2')
    expect(getMultiplierRange(croStake, '3')).toEqual('1.4')
    expect(getMultiplierRange(croStake, '4')).toEqual('2.0')
  })

  it('should not be 0 for stake 50000000-1 CRO', () => {
    const croStake = toBigNumber('49999999')
    expect(getMultiplierRange(croStake, '1')).toEqual('8.0')
    expect(getMultiplierRange(croStake, '2')).toEqual('9.2')
    expect(getMultiplierRange(croStake, '3')).toEqual('11.4')
    expect(getMultiplierRange(croStake, '4')).toEqual('16.0')
  })

  it('should not be 0 for stake 50000000 CRO', () => {
    const croStake = toBigNumber('50000000')
    expect(getMultiplierRange(croStake, '1')).toEqual('10.0')
    expect(getMultiplierRange(croStake, '2')).toEqual('11.5')
    expect(getMultiplierRange(croStake, '3')).toEqual('14.3')
    expect(getMultiplierRange(croStake, '4')).toEqual('20.0')
  })
})
