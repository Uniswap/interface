import { maxDecimalsReached, truncateToMaxDecimals } from 'utilities/src/format/truncateToMaxDecimals'

describe('truncateToMaxDecimals', () => {
  it('returns the same string if it has less than max decimals', () => {
    const valueWith1Decimal = '1.0'

    expect(
      truncateToMaxDecimals({
        value: valueWith1Decimal,
        maxDecimals: 1,
      }),
    ).toBe(valueWith1Decimal)

    const valueWith18Decimals = '1.999999999999999999'

    expect(
      truncateToMaxDecimals({
        value: valueWith18Decimals,
        maxDecimals: 18,
      }),
    ).toBe(valueWith18Decimals)
  })

  it('truncates the value if it has more than max decimals', () => {
    expect(
      truncateToMaxDecimals({
        value: '1.01',
        maxDecimals: 1,
      }),
    ).toBe('1.0')

    expect(
      truncateToMaxDecimals({
        value: '1.123456789',
        maxDecimals: 3,
      }),
    ).toBe('1.123')
  })

  it('does not remove the trailing decimal separator for incomplete input values', () => {
    expect(
      truncateToMaxDecimals({
        value: '1.',
        maxDecimals: 8,
      }),
    ).toBe('1.')
  })
})

describe('maxDecimalsReached', () => {
  it('returns true when number of decimals are equal or over the max', () => {
    expect(
      maxDecimalsReached({
        value: '1.1234',
        maxDecimals: 4,
      }),
    ).toBe(true)

    expect(
      maxDecimalsReached({
        value: '1.12345',
        maxDecimals: 4,
      }),
    ).toBe(true)
  })

  it('returns false when number of decimals are lower than the max', () => {
    expect(
      maxDecimalsReached({
        value: '1.123',
        maxDecimals: 4,
      }),
    ).toBe(false)

    expect(
      maxDecimalsReached({
        value: '1',
        maxDecimals: 4,
      }),
    ).toBe(false)
  })
})
