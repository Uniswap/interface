import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { DAI, USDC } from 'uniswap/src/constants/tokens'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { logger } from 'utilities/src/logger/logger'
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

  it('truncates an over-precise float amount to the token decimals', () => {
    expect(
      getCurrencyAmount({
        value: '0.00000000000000000000001',
        valueType: ValueType.Exact,
        currency: DAI,
      }),
    ).toEqual(ZERO_DAI)
  })

  it('keeps full string precision when truncating an 18-decimal amount', () => {
    expect(
      getCurrencyAmount({
        value: '1.1234567890123456789',
        valueType: ValueType.Exact,
        currency: DAI,
      }),
    ).toEqual(CurrencyAmount.fromRawAmount(DAI, '1123456789012345678'))
  })

  it('truncates (does not round) extra decimals on a 6-decimal token', () => {
    const errorSpy = vi.spyOn(logger, 'error')
    expect(
      getCurrencyAmount({
        value: '8.406289655144948446',
        valueType: ValueType.Exact,
        currency: USDC,
      }),
    ).toEqual(CurrencyAmount.fromRawAmount(USDC, '8406289'))
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('truncates an over-precise scientific notation amount', () => {
    expect(getCurrencyAmount({ value: '1.23456789e-3', valueType: ValueType.Exact, currency: USDC })).toEqual(
      CurrencyAmount.fromRawAmount(USDC, '1234'),
    )
  })

  it('drops the fraction for a 0-decimal token', () => {
    const zeroDecimalToken = new Token(1, '0x0000000000000000000000000000000000000001', 0, 'ZERO')
    expect(getCurrencyAmount({ value: '5.7', valueType: ValueType.Exact, currency: zeroDecimalToken })).toEqual(
      CurrencyAmount.fromRawAmount(zeroDecimalToken, '5'),
    )
  })

  it('handle incorrect raw amount', () => {
    vi.spyOn(console, 'error').mockImplementation(noOpFunction)
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
    vi.spyOn(console, 'error').mockImplementation(noOpFunction)
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
