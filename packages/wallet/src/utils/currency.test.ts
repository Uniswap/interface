import { DAI, USDC } from 'wallet/src/constants/tokens'
import { getCurrencyDisplayText, getFormattedCurrencyAmount } from './currency'

describe(getFormattedCurrencyAmount, () => {
  it('formats valid amount', () => {
    expect(getFormattedCurrencyAmount(DAI, '1000000000000000000')).toEqual('1.00 ')
  })

  it('handles invalid Currency', () => {
    expect(getFormattedCurrencyAmount(undefined, '1')).toEqual('')
    expect(getFormattedCurrencyAmount(null, '1')).toEqual('')
  })

  it('handles error', () => {
    // invalid raw amount will throw error
    expect(getFormattedCurrencyAmount(USDC, '0.1')).toEqual('')
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
