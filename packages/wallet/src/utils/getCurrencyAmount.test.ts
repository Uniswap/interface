import { CurrencyAmount } from '@uniswap/sdk-core'
import { DAI } from 'wallet/src/constants/tokens'
import { getCurrencyAmount, ValueType } from 'wallet/src/utils/getCurrencyAmount'

const ONE_DAI = CurrencyAmount.fromRawAmount(DAI, '1000000000000000000')
const HALF_DAI = CurrencyAmount.fromRawAmount(DAI, '500000000000000000')
const FRACTION_OF_DAI = CurrencyAmount.fromRawAmount(DAI, '1000000000000000')

describe(getCurrencyAmount, () => {
  it('handle undefined inputs', () => {
    expect(
      getCurrencyAmount({ value: undefined, valueType: ValueType.Raw, currency: undefined })
    ).toBeUndefined()
  })

  it('handle undefined float value', () => {
    expect(
      getCurrencyAmount({ value: undefined, valueType: ValueType.Exact, currency: DAI })
    ).toBeUndefined()
  })

  it('handle undefined uin5256 value', () => {
    expect(
      getCurrencyAmount({ value: undefined, valueType: ValueType.Raw, currency: DAI })
    ).toBeUndefined()
  })

  it('handle undefined Currency wit defined float value', () => {
    expect(
      getCurrencyAmount({ value: '1.6', valueType: ValueType.Exact, currency: undefined })
    ).toBeUndefined()
  })

  it('handle undefined Currency wit defined uint256 value', () => {
    expect(
      getCurrencyAmount({ value: '1000000000', valueType: ValueType.Exact, currency: undefined })
    ).toBeUndefined()
  })

  it('return null when float value is 0', () => {
    expect(getCurrencyAmount({ value: '0', valueType: ValueType.Exact, currency: DAI })).toBeNull()
  })

  it('parse standard float amount', () => {
    expect(getCurrencyAmount({ value: '1', valueType: ValueType.Exact, currency: DAI })).toEqual(
      ONE_DAI
    )
  })

  it('parse standard raw amount', () => {
    expect(
      getCurrencyAmount({
        value: '1000000000000000000',
        valueType: ValueType.Raw,
        currency: DAI,
      })
    ).toEqual(ONE_DAI)
  })

  it('parse decimal float amount', () => {
    expect(getCurrencyAmount({ value: '0.5', valueType: ValueType.Exact, currency: DAI })).toEqual(
      HALF_DAI
    )
  })

  it('parse fractional raw amount', () => {
    expect(
      getCurrencyAmount({
        value: '500000000000000000',
        valueType: ValueType.Raw,
        currency: DAI,
      })
    ).toEqual(HALF_DAI)
  })

  it('handle over-precise float amount', () => {
    expect(
      getCurrencyAmount({
        value: '0.00000000000000000000001',
        valueType: ValueType.Exact,
        currency: DAI,
      })
    ).toBeNull()
  })

  it('handle incorrect raw amount', () => {
    expect(
      getCurrencyAmount({
        value: '0.1',
        valueType: ValueType.Raw,
        currency: DAI,
      })
    ).toBeNull()
  })

  it('handle decimal without digits', () => {
    expect(
      getCurrencyAmount({
        value: '.',
        valueType: ValueType.Exact,
        currency: DAI,
      })
    ).toBeNull()
  })

  it('handle invalid values', () => {
    expect(
      getCurrencyAmount({
        value: '123as2s',
        valueType: ValueType.Exact,
        currency: DAI,
      })
    ).toBeNull()
  })

  it('handles hex input', () => {
    expect(
      getCurrencyAmount({
        value: '0x38d7ea4c68000',
        valueType: ValueType.Raw,
        currency: DAI,
      })
    ).toEqual(FRACTION_OF_DAI)
  })
})
