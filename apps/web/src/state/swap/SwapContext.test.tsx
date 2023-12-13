import { Percent } from '@uniswap/sdk-core'
import { render } from 'test-utils/render'

import { SwapContextProvider, useSwapContext } from './SwapContext'

describe('Swap Context', () => {
  test('should use context', () => {
    let swapContext
    const TestComponent = () => {
      swapContext = useSwapContext()
      return <div />
    }

    render(
      <SwapContextProvider>
        <TestComponent />
      </SwapContextProvider>
    )

    expect(swapContext).toEqual({
      chainId: undefined,
      currentTab: 'swap',
      derivedSwapInfo: {
        allowedSlippage: new Percent(5, 1000),
        autoSlippage: new Percent(5, 1000),
        currencies: {
          INPUT: undefined,
          OUTPUT: undefined,
        },
        currencyBalances: {
          INPUT: undefined,
          OUTPUT: undefined,
        },
        inputError: expect.any(Object),
        inputTax: new Percent(0),
        outputFeeFiatValue: undefined,
        outputTax: new Percent(0),
        parsedAmount: undefined,
        trade: {
          currentTrade: undefined,
          error: undefined,
          state: 'invalid',
          trade: undefined,
        },
      },
      prefilledState: {
        inputCurrencyId: undefined,
        outputCurrencyId: undefined,
      },
      setCurrentTab: expect.any(Function),
      setSwapState: expect.any(Function),
      swapState: {
        inputCurrencyId: undefined,
        outputCurrencyId: undefined,
        independentField: 'INPUT',
        recipient: null,
        typedValue: '',
      },
    })
  })
})
