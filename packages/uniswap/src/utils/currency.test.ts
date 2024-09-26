import { DAI, USDC } from 'uniswap/src/constants/tokens'
import { mockLocalizedFormatter } from 'uniswap/src/test/mocks'
import { getCurrencyDisplayText, getFormattedCurrencyAmount } from 'uniswap/src/utils/currency'
import { noOpFunction } from 'utilities/src/test/utils'

describe(getFormattedCurrencyAmount, () => {
  it('formats valid amount', () => {
    expect(getFormattedCurrencyAmount(DAI, '1000000000000000000', mockLocalizedFormatter)).toEqual('1.00 ')
  })

  it('handles invalid Currency', () => {
    expect(getFormattedCurrencyAmount(undefined, '1', mockLocalizedFormatter)).toEqual('')
    expect(getFormattedCurrencyAmount(null, '1', mockLocalizedFormatter)).toEqual('')
  })

  it('handles error', () => {
    // invalid raw amount will throw error
    jest.spyOn(console, 'error').mockImplementation(noOpFunction)
    expect(getFormattedCurrencyAmount(USDC, '0.1', mockLocalizedFormatter)).toEqual('')
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
