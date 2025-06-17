import { DAI, USDC } from 'uniswap/src/constants/tokens'
import { Locale } from 'uniswap/src/features/language/constants'
import { mockLocalizedFormatter } from 'uniswap/src/test/mocks'
import { getCurrencyDisplayText, getFormattedCurrencyAmount } from 'uniswap/src/utils/currency'
import { noOpFunction } from 'utilities/src/test/utils'

const mockFormatter = mockLocalizedFormatter(Locale.EnglishUnitedStates)

describe(getFormattedCurrencyAmount, () => {
  it('formats valid amount', () => {
    expect(
      getFormattedCurrencyAmount({ currency: DAI, amount: '1000000000000000000', formatter: mockFormatter }),
    ).toEqual('1.00 ')
  })

  it('handles invalid Currency', () => {
    expect(getFormattedCurrencyAmount({ currency: undefined, amount: '1', formatter: mockFormatter })).toEqual('')
    expect(getFormattedCurrencyAmount({ currency: null, amount: '1', formatter: mockFormatter })).toEqual('')
  })

  it('handles error', () => {
    // invalid raw amount will throw error
    jest.spyOn(console, 'error').mockImplementation(noOpFunction)
    expect(getFormattedCurrencyAmount({ currency: USDC, amount: '0.1', formatter: mockFormatter })).toEqual('')
  })
})

describe(getCurrencyDisplayText, () => {
  it('Returns symbol for token', () => {
    expect(getCurrencyDisplayText(DAI, DAI.address)).toEqual('DAI')
  })

  it('handles undefined currency with address', () => {
    expect(getCurrencyDisplayText(undefined, DAI.address)).toEqual('0x6B17...1d0F')
  })

  it('handles undefined address with currency', () => {
    expect(getCurrencyDisplayText(DAI, undefined)).toEqual('DAI')
  })
})
