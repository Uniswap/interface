import { SwapTab } from 'components/swap/constants'
import { parse } from 'qs'
import { TEST_RECIPIENT_ADDRESS } from 'test-utils/constants'

import { Field } from './actions'
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
        [Field.OUTPUT]: { currencyId: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
        [Field.INPUT]: { currencyId: 'ETH' },
        typedValue: '20.5',
        independentField: Field.OUTPUT,
        recipient: null,
        currentTab: SwapTab.Swap,
      })
    })

    test('does not duplicate eth for invalid output token', () => {
      expect(
        queryParametersToSwapState(parse('?outputCurrency=invalid', { parseArrays: false, ignoreQueryPrefix: true }))
      ).toEqual({
        [Field.INPUT]: { currencyId: 'ETH' },
        [Field.OUTPUT]: { currencyId: null },
        typedValue: '',
        independentField: Field.INPUT,
        recipient: null,
        currentTab: SwapTab.Swap,
      })
    })

    test('output ETH only', () => {
      expect(
        queryParametersToSwapState(
          parse('?outputCurrency=eth&exactAmount=20.5', { parseArrays: false, ignoreQueryPrefix: true })
        )
      ).toEqual({
        [Field.OUTPUT]: { currencyId: 'ETH' },
        [Field.INPUT]: { currencyId: null },
        typedValue: '20.5',
        independentField: Field.INPUT,
        recipient: null,
        currentTab: SwapTab.Swap,
      })
    })

    test('invalid recipient', () => {
      expect(
        queryParametersToSwapState(
          parse('?outputCurrency=eth&exactAmount=20.5&recipient=abc', { parseArrays: false, ignoreQueryPrefix: true })
        )
      ).toEqual({
        [Field.OUTPUT]: { currencyId: 'ETH' },
        [Field.INPUT]: { currencyId: null },
        typedValue: '20.5',
        independentField: Field.INPUT,
        recipient: null,
        currentTab: SwapTab.Swap,
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
        [Field.OUTPUT]: { currencyId: 'ETH' },
        [Field.INPUT]: { currencyId: null },
        typedValue: '20.5',
        independentField: Field.INPUT,
        recipient: TEST_RECIPIENT_ADDRESS,
        currentTab: SwapTab.Swap,
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
        [Field.OUTPUT]: { currencyId: 'ETH' },
        [Field.INPUT]: { currencyId: null },
        typedValue: '20.5',
        independentField: Field.INPUT,
        recipient: 'bob.argent.xyz',
        currentTab: SwapTab.Swap,
      })
    })
  })
})
