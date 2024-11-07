import { CurrencyAmount } from '@uniswap/sdk-core'
import { DAI } from 'uniswap/src/constants/tokens'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { noOpFunction } from 'utilities/src/test/utils'

const ZERO_DAI = CurrencyAmount.fromRawAmount(DAI, '0')
const ONE_DAI = CurrencyAmount.fromRawAmount(DAI, '1000000000000000000')
const HALF_DAI = CurrencyAmount.fromRawAmount(DAI, '500000000000000000')
const FRACTION_OF_DAI = CurrencyAmount.fromRawAmount(DAI, '1000000000000000')

describe(getCurrencyAmount, () => {
  it('handle undefined inputs', () => {
    expect(getCurrencyAmount({ value: undefined, valueType: ValueType.Raw, currency: undefined })).toBeUndefined()
  })

  it('handle undefined float value', () => {
    expect(getCurrencyAmount({ value: undefined, valueType: ValueType.Exact, currency: DAI })).toBeUndefined()
  })

  it('handle undefined uin5256 value', () => {
    expect(getCurrencyAmount({ value: undefined, valueType: ValueType.Raw, currency: DAI })).toBeUndefined()
  })

  it('handle undefined Currency wit defined float value', () => {
    expect(getCurrencyAmount({ value: '1.6', valueType: ValueType.Exact, currency: undefined })).toBeUndefined()
  })

  it('handle undefined Currency with defined uint256 value', () => {
    expect(getCurrencyAmount({ value: '1000000000', valueType: ValueType.Exact, currency: undefined })).toBeUndefined()
  })

  it('return 0 when float value is 0', () => {
    expect(getCurrencyAmount({ value: '0', valueType: ValueType.Exact, currency: DAI })).toEqual(ZERO_DAI)
  })

  it('return undefined when float value is undefined', () => {
    expect(getCurrencyAmount({ value: undefined, valueType: ValueType.Exact, currency: DAI })).toBeUndefined()
  })

  it('parse standard float amount', () => {
    expect(getCurrencyAmount({ value: '1', valueType: ValueType.Exact, currency: DAI })).toEqual(ONE_DAI)
  })

  it('parse standard raw amount', () => {
    expect(
      getCurrencyAmount({
        value: '1000000000000000000',
        valueType: ValueType.Raw,
        currency: DAI,
      }),
    ).toEqual(ONE_DAI)
  })

  it('parse decimal float amount', () => {
    expect(getCurrencyAmount({ value: '0.5', valueType: ValueType.Exact, currency: DAI })).toEqual(HALF_DAI)
  })

  it('parse fractional raw amount', () => {
    expect(
      getCurrencyAmount({
        value: '500000000000000000',
        valueType: ValueType.Raw,
        currency: DAI,
      }),
    ).toEqual(HALF_DAI)
  })

  it('handle over-precise float amount', () => {
    jest.spyOn(console, 'error').mockImplementation(noOpFunction)
    expect(
      getCurrencyAmount({
        value: '0.00000000000000000000001',
        valueType: ValueType.Exact,
        currency: DAI,
      }),
    ).toBeNull()
  })

  it('handle incorrect raw amount', () => {
    jest.spyOn(console, 'error').mockImplementation(noOpFunction)
    expect(
      getCurrencyAmount({
        value: '0.1',
        valueType: ValueType.Raw,
        currency: DAI,
      }),
    ).toBeNull()
  })

  it('handle decimal without digits', () => {
    expect(
      getCurrencyAmount({
        value: '.',
        valueType: ValueType.Exact,
        currency: DAI,
      }),
    ).toEqual(ZERO_DAI)
  })

  it('handle invalid values', () => {
    jest.spyOn(console, 'error').mockImplementation(noOpFunction)
    expect(
      getCurrencyAmount({
        value: '123as2s',
        valueType: ValueType.Exact,
        currency: DAI,
      }),
    ).toBeNull()
  })

  it('handles hex input', () => {
    expect(
      getCurrencyAmount({
        value: '0x38d7ea4c68000',
        valueType: ValueType.Raw,
        currency: DAI,
      }),
    ).toEqual(FRACTION_OF_DAI)
  })
})
