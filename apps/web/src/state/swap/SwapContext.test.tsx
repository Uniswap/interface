import { ChainId, Percent } from '@taraswap/sdk-core'
import { Field } from 'components/swap/constants'
import { nativeOnChain } from 'constants/tokens'
import { useSwapAndLimitContext, useSwapContext } from 'state/swap/hooks'
import { SwapAndLimitContext, SwapInfo } from 'state/swap/types'
import { render } from 'test-utils/render'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { SwapAndLimitContextProvider, SwapContextProvider } from './SwapContext'

jest.mock('hooks/useContract', () => ({
  ...jest.requireActual('hooks/useContract'),
  useContract: jest.fn(),
}))

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
      multichainUXEnabled: undefined,
      setSelectedChainId: expect.any(Function),
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
          setSelectedChainId: jest.fn(),
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
