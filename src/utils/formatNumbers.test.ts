import { CurrencyAmount, Price } from '@uniswap/sdk-core'
import { renBTC, USDC_MAINNET } from 'constants/tokens'

import { currencyAmountToPreciseFloat, formatTransactionAmount, priceToPreciseFloat } from './formatNumbers'

describe('currencyAmountToPreciseFloat', () => {
  it('small number', () => {
    const currencyAmount = CurrencyAmount.fromFractionalAmount(USDC_MAINNET, '20000', '7')
    expect(currencyAmountToPreciseFloat(currencyAmount)).toEqual(0.00285714)
  })
  it('tiny number', () => {
    const currencyAmount = CurrencyAmount.fromFractionalAmount(USDC_MAINNET, '2', '7')
    expect(currencyAmountToPreciseFloat(currencyAmount)).toEqual(0.000000285714)
  })
  it('lots of decimals', () => {
    const currencyAmount = CurrencyAmount.fromFractionalAmount(USDC_MAINNET, '200000000', '7')
    expect(currencyAmountToPreciseFloat(currencyAmount)).toEqual(28.571428)
  })
  it('integer', () => {
    const currencyAmount = CurrencyAmount.fromRawAmount(USDC_MAINNET, '20000000')
    expect(currencyAmountToPreciseFloat(currencyAmount)).toEqual(20.0)
  })
})

describe('priceToPreciseFloat', () => {
  it('small number', () => {
    const price = new Price(renBTC, USDC_MAINNET, 1234, 1)
    expect(priceToPreciseFloat(price)).toEqual(0.0810373)
  })
  it('tiny number', () => {
    const price = new Price(renBTC, USDC_MAINNET, 12345600, 1)
    expect(priceToPreciseFloat(price)).toEqual(0.00000810005)
  })
  it('lots of decimals', () => {
    const price = new Price(renBTC, USDC_MAINNET, 123, 7)
    expect(priceToPreciseFloat(price)).toEqual(5.691056911)
  })
  it('integer', () => {
    const price = new Price(renBTC, USDC_MAINNET, 1, 7)
    expect(priceToPreciseFloat(price)).toEqual(700)
  })
})

describe('formatTransactionAmount', () => {
  it('undefined or null', () => {
    expect(formatTransactionAmount(undefined)).toEqual('')
    expect(formatTransactionAmount(null)).toEqual('')
  })
  it('0', () => {
    expect(formatTransactionAmount(0)).toEqual('0.00')
  })
  it('< 0.00001', () => {
    expect(formatTransactionAmount(0.000000001)).toEqual('<0.00001')
  })
  it('1 > number ≥ .00001 full precision', () => {
    expect(formatTransactionAmount(0.987654321)).toEqual('0.98765')
  })
  it('1 > number ≥ .00001 minimum 2 decimals', () => {
    expect(formatTransactionAmount(0.9)).toEqual('0.90')
  })
  it('1 > number ≥ .00001 no trailing zeros beyond 2nd decimal', () => {
    expect(formatTransactionAmount(0.901000123)).toEqual('0.901')
  })
  it('10,000 > number ≥ 1 round to 6 sig figs', () => {
    expect(formatTransactionAmount(7654.3210789)).toEqual('7,654.32')
  })
  it('10,000 > number ≥ 1 round to 6 sig figs 2nd case', () => {
    expect(formatTransactionAmount(76.3210789)).toEqual('76.3211')
  })
  it('10,000 > number ≥ 1 no trailing zeros beyond 2nd decimal place', () => {
    expect(formatTransactionAmount(7.60000054321)).toEqual('7.60')
  })
  it('10,000 > number ≥ 1 always show at least 2 decimal places', () => {
    expect(formatTransactionAmount(7)).toEqual('7.00')
  })
  it('1M > number ≥ 10,000 few decimals', () => {
    expect(formatTransactionAmount(765432.1)).toEqual('765,432.10')
  })
  it('1M > number ≥ 10,000 lots of decimals', () => {
    expect(formatTransactionAmount(76543.2123424)).toEqual('76,543.21')
  })
  it('Number ≥ 1M', () => {
    expect(formatTransactionAmount(1234567.8901)).toEqual('1,234,567.89')
  })
  it('Number ≥ 1M extra long', () => {
    // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
    expect(formatTransactionAmount(1234567890123456.789)).toEqual('1.234568e+15')
  })
})
