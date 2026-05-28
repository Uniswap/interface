import { AddressZero } from '@ethersproject/constants'
import { CurrencyAmount, Percent, Token } from '@uniswap/sdk-core'
import { calculateSlippageAmount } from 'utils/calculateSlippageAmount'

describe('#calculateSlippageAmount', () => {
  it('bounds are correct', () => {
    const tokenAmount = CurrencyAmount.fromRawAmount(new Token(1, AddressZero, 0), '100')
    expect(() => calculateSlippageAmount(tokenAmount, new Percent(-1, 10_000))).toThrow('Unexpected slippage')
    expect(() => calculateSlippageAmount(tokenAmount, new Percent(10_001, 10_000))).toThrow('Unexpected slippage')
    expect(calculateSlippageAmount(tokenAmount, new Percent(0, 10_000)).map((bound) => bound.toString())).toEqual([
      '100',
      '100',
    ])
    expect(calculateSlippageAmount(tokenAmount, new Percent(5, 100)).map((bound) => bound.toString())).toEqual([
      '95',
      '105',
    ])
    expect(calculateSlippageAmount(tokenAmount, new Percent(100, 10_000)).map((bound) => bound.toString())).toEqual([
      '99',
      '101',
    ])
    expect(calculateSlippageAmount(tokenAmount, new Percent(200, 10_000)).map((bound) => bound.toString())).toEqual([
      '98',
      '102',
    ])
    expect(calculateSlippageAmount(tokenAmount, new Percent(10000, 10_000)).map((bound) => bound.toString())).toEqual([
      '0',
      '200',
    ])
  })
  it('works for 18 decimals', () => {
    const tokenAmount = CurrencyAmount.fromRawAmount(new Token(1, AddressZero, 18), '100')
    expect(() => calculateSlippageAmount(tokenAmount, new Percent(-1, 10_000))).toThrow('Unexpected slippage')
    expect(() => calculateSlippageAmount(tokenAmount, new Percent(10_001, 10_000))).toThrow('Unexpected slippage')
    expect(calculateSlippageAmount(tokenAmount, new Percent(0, 10_000)).map((bound) => bound.toString())).toEqual([
      '100',
      '100',
    ])
    expect(calculateSlippageAmount(tokenAmount, new Percent(5, 100)).map((bound) => bound.toString())).toEqual([
      '95',
      '105',
    ])
    expect(calculateSlippageAmount(tokenAmount, new Percent(100, 10_000)).map((bound) => bound.toString())).toEqual([
      '99',
      '101',
    ])
    expect(calculateSlippageAmount(tokenAmount, new Percent(200, 10_000)).map((bound) => bound.toString())).toEqual([
      '98',
      '102',
    ])
    expect(calculateSlippageAmount(tokenAmount, new Percent(10000, 10_000)).map((bound) => bound.toString())).toEqual([
      '0',
      '200',
    ])
  })
})
