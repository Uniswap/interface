import { ChainId, Percent } from '@uniswap/sdk-core'
import { Field, SwapTab } from 'components/swap/constants'
import { nativeOnChain } from 'constants/tokens'
import { render } from 'test-utils/render'

import { SwapInfo } from './hooks'
import {
  SwapAndLimitContext,
  SwapAndLimitContextProvider,
  SwapContextProvider,
  useSwapAndLimitContext,
  useSwapContext,
} from './SwapContext'

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
      setSwapState: expect.any(Function),
      swapState: {
        independentField: 'INPUT',
        typedValue: '',
      },
    })
  })
})

describe('SwapAndLimitContext', () => {
  test('should use context', () => {
    let swapAndLimitContext
    const TestComponent = () => {
      swapAndLimitContext = useSwapAndLimitContext()
      return <div />
    }

    render(
      <SwapAndLimitContextProvider>
        <TestComponent />
      </SwapAndLimitContextProvider>
    )

    expect(swapAndLimitContext).toEqual({
      currencyState: {
        inputCurrencyId: undefined,
        outputCurrencyId: undefined,
      },
      prefilledState: {
        inputCurrencyId: undefined,
        outputCurrencyId: undefined,
      },
      setCurrencyState: expect.any(Function),
      currentTab: SwapTab.Swap,
      setCurrentTab: expect.any(Function),
      chainId: undefined,
    })
  })
})

describe('Combined contexts', () => {
  test('should use combined contexts', () => {
    let derivedSwapInfo: SwapInfo

    const TestComponent = () => {
      derivedSwapInfo = useSwapContext().derivedSwapInfo
      return <div />
    }

    render(
      <SwapAndLimitContext.Provider
        value={{
          currencyState: {
            inputCurrency: nativeOnChain(ChainId.MAINNET),
            outputCurrency: undefined,
          },
          prefilledState: {
            inputCurrency: undefined,
            outputCurrency: undefined,
          },
          setCurrencyState: expect.any(Function),
          chainId: ChainId.MAINNET,
          currentTab: SwapTab.Swap,
          setCurrentTab: expect.any(Function),
        }}
      >
        <SwapContextProvider>
          <TestComponent />
        </SwapContextProvider>
      </SwapAndLimitContext.Provider>
    )

    // @ts-ignore rendering TestComponent sets derivedSwapInfo value
    expect(derivedSwapInfo?.currencies).toEqual({
      [Field.INPUT]: nativeOnChain(ChainId.MAINNET),
      [Field.OUTPUT]: undefined,
    })
  })
})
