import { getEarnAmountInputSizingValue } from 'src/components/earn/useEarnAmountInputFontSizing'

describe(getEarnAmountInputSizingValue, (): void => {
  it('sizes each input mode from the amount that is actually visible', (): void => {
    const args = {
      fiatSymbol: '$',
      symbol: 'USDC',
      value: '91.24',
    }

    expect(getEarnAmountInputSizingValue({ ...args, isFiatInput: true })).toBe('$91.24')
    expect(getEarnAmountInputSizingValue({ ...args, isFiatInput: false })).toBe('91.24 USDC')
  })

  it('uses the heading-sized zero placeholder when the input is empty', (): void => {
    expect(
      getEarnAmountInputSizingValue({
        fiatSymbol: '$',
        isFiatInput: true,
        symbol: 'USDC',
        value: '',
      }),
    ).toBe('$0')
  })
})
