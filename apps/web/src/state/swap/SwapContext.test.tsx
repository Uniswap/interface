import { Percent } from '@uniswap/sdk-core'
import { SwapForm } from 'pages/Swap/SwapForm'
import { MultichainContextProvider } from 'state/multichain/MultichainContext'
import { SwapAndLimitContextProvider, SwapContextProvider } from 'state/swap/SwapContext'
import { SwapAndLimitContext, SwapInfo } from 'state/swap/types'
import { useSwapAndLimitContext, useSwapContext } from 'state/swap/useSwapContext'
import { render, screen } from 'test-utils/render'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyField } from 'uniswap/src/types/currency'
import { SwapTab } from 'uniswap/src/types/screens/interface'

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
      </SwapContextProvider>,
    )

    expect(swapContext).toEqual({
      derivedSwapInfo: {
        allowedSlippage: new Percent(5, 1000),
        autoSlippage: new Percent(5, 1000),
        currencies: {
          input: undefined,
          output: undefined,
        },
        currencyBalances: {
          input: undefined,
          output: undefined,
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
        independentField: 'input',
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
      <MultichainContextProvider>
        <SwapAndLimitContextProvider>
          <TestComponent />
        </SwapAndLimitContextProvider>
        ,
      </MultichainContextProvider>,
    )

    expect(swapAndLimitContext).toEqual({
      currencyState: {
        inputCurrency: undefined,
        outputCurrency: undefined,
      },
      prefilledState: {
        inputCurrency: undefined,
        outputCurrency: undefined,
      },
      setCurrencyState: expect.any(Function),
      currentTab: SwapTab.Swap,
      setCurrentTab: expect.any(Function),
      isSwapAndLimitContext: true,
    })
  })

  describe('SwapForm', () => {
    beforeEach(() => {
      window.history.pushState({}, '', '/swap')
    })

    test('multichain ux enabled', () => {
      render(
        <MultichainContextProvider initialChainId={UniverseChainId.Optimism}>
          <SwapAndLimitContextProvider>
            <SwapForm />
          </SwapAndLimitContextProvider>
        </MultichainContextProvider>,
      )
      expect(screen.getByTestId('swap-button')).toBeInTheDocument()
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
            inputCurrency: nativeOnChain(UniverseChainId.Mainnet),
            outputCurrency: undefined,
          },
          prefilledState: {
            inputCurrency: undefined,
            outputCurrency: undefined,
          },
          setCurrencyState: expect.any(Function),
          currentTab: SwapTab.Swap,
          setCurrentTab: expect.any(Function),
        }}
      >
        <SwapContextProvider>
          <TestComponent />
        </SwapContextProvider>
      </SwapAndLimitContext.Provider>,
    )

    // @ts-ignore rendering TestComponent sets derivedSwapInfo value
    expect(derivedSwapInfo?.currencies).toEqual({
      [CurrencyField.INPUT]: nativeOnChain(UniverseChainId.Mainnet),
      [CurrencyField.OUTPUT]: undefined,
    })
  })
})
