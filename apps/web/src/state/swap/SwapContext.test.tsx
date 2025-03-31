import { MultichainContextProvider } from 'state/multichain/MultichainContext'
import { SwapAndLimitContextProvider } from 'state/swap/SwapContext'
import { useSwapAndLimitContext } from 'state/swap/useSwapContext'
import { render } from 'test-utils/render'
import { Flex } from 'ui/src'
import { SwapTab } from 'uniswap/src/types/screens/interface'

jest.mock('hooks/useContract', () => ({
  ...jest.requireActual('hooks/useContract'),
  useContract: jest.fn(),
}))

describe('SwapAndLimitContext', () => {
  test('should use context', () => {
    let swapAndLimitContext
    const TestComponent = () => {
      swapAndLimitContext = useSwapAndLimitContext()
      return <Flex />
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
      setCurrencyState: expect.any(Function),
      currentTab: SwapTab.Swap,
      setCurrentTab: expect.any(Function),
      isSwapAndLimitContext: true,
    })
  })
})
