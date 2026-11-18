import { CurrencyAmount } from '@uniswap/sdk-core'
import { DAI } from 'uniswap/src/constants/tokens'
import { getPriceChangeText } from 'uniswap/src/features/transactions/swap/review/SwapDetails/AcceptNewQuoteRow'
import { CurrencyField } from 'uniswap/src/types/currency'

const dai = (amount: string): CurrencyAmount<typeof DAI> =>
  CurrencyAmount.fromRawAmount(DAI, `${amount}000000000000000000`)

describe(getPriceChangeText, () => {
  it('formats the change of the derived amount with a sign', () => {
    expect(
      getPriceChangeText({
        derivedSwapInfo: {
          exactCurrencyField: CurrencyField.INPUT,
          currencyAmounts: { [CurrencyField.INPUT]: dai('1'), [CurrencyField.OUTPUT]: dai('101') },
        },
        acceptedDerivedSwapInfo: {
          currencyAmounts: { [CurrencyField.INPUT]: dai('1'), [CurrencyField.OUTPUT]: dai('100') },
        },
      }),
    ).toBe('(+1.00%)')
  })

  it('returns undefined instead of an empty "(%)" when an amount is missing', () => {
    expect(
      getPriceChangeText({
        derivedSwapInfo: {
          exactCurrencyField: CurrencyField.INPUT,
          currencyAmounts: { [CurrencyField.INPUT]: dai('1'), [CurrencyField.OUTPUT]: null },
        },
        acceptedDerivedSwapInfo: {
          currencyAmounts: { [CurrencyField.INPUT]: dai('1'), [CurrencyField.OUTPUT]: dai('100') },
        },
      }),
    ).toBeUndefined()
  })
})
