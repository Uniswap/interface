import { Field } from 'components/swap/constants'
import { parse } from 'qs'
import { TEST_RECIPIENT_ADDRESS } from 'test-utils/constants'

import { queryParametersToSwapState } from './hooks'

describe('hooks', () => {
  describe('#queryParametersToSwapState', () => {
    test('ETH to DAI', () => {
      expect(
        queryParametersToSwapState(
          parse(
            '?inputCurrency=ETH&outputCurrency=0x6b175474e89094c44da98b954eedeac495271d0f&exactAmount=20.5&exactField=output',
            { parseArrays: false, ignoreQueryPrefix: true }
          )
        )
      ).toEqual({
        outputCurrencyId: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        inputCurrencyId: 'ETH',
        typedValue: '20.5',
        independentField: Field.OUTPUT,
        recipient: null,
      })
    })

    test('does not duplicate eth for invalid output token', () => {
      expect(
        queryParametersToSwapState(parse('?outputCurrency=invalid', { parseArrays: false, ignoreQueryPrefix: true }))
      ).toEqual({
        inputCurrencyId: 'ETH',
        outputCurrencyId: null,
        typedValue: '',
        independentField: Field.INPUT,
        recipient: null,
      })
    })

    test('output ETH only', () => {
      expect(
        queryParametersToSwapState(
          parse('?outputCurrency=eth&exactAmount=20.5', { parseArrays: false, ignoreQueryPrefix: true })
        )
      ).toEqual({
        outputCurrencyId: 'ETH',
        inputCurrencyId: null,
        typedValue: '20.5',
        independentField: Field.INPUT,
        recipient: null,
      })
    })

    test('invalid recipient', () => {
      expect(
        queryParametersToSwapState(
          parse('?outputCurrency=eth&exactAmount=20.5&recipient=abc', { parseArrays: false, ignoreQueryPrefix: true })
        )
      ).toEqual({
        outputCurrencyId: 'ETH',
        inputCurrencyId: null,
        typedValue: '20.5',
        independentField: Field.INPUT,
        recipient: null,
      })
    })

    test('valid recipient', () => {
      expect(
        queryParametersToSwapState(
          parse(`?outputCurrency=eth&exactAmount=20.5&recipient=${TEST_RECIPIENT_ADDRESS}`, {
            parseArrays: false,
            ignoreQueryPrefix: true,
          })
        )
      ).toEqual({
        outputCurrencyId: 'ETH',
        inputCurrencyId: null,
        typedValue: '20.5',
        independentField: Field.INPUT,
        recipient: TEST_RECIPIENT_ADDRESS,
      })
    })
    test('accepts any recipient', () => {
      expect(
        queryParametersToSwapState(
          parse('?outputCurrency=eth&exactAmount=20.5&recipient=bob.argent.xyz', {
            parseArrays: false,
            ignoreQueryPrefix: true,
          })
        )
      ).toEqual({
        outputCurrencyId: 'ETH',
        inputCurrencyId: null,
        typedValue: '20.5',
        independentField: Field.INPUT,
        recipient: 'bob.argent.xyz',
      })
    })
  })
})
