vi.mock('hooks/Tokens')

import { useCurrencyInfo } from 'hooks/Tokens'
import SendCurrencyInputForm from 'pages/Swap/Send/SendCurrencyInputForm'
import { MultichainContext } from 'state/multichain/types'
import { SendContext, SendContextType } from 'state/send/SendContext'
import { SwapAndLimitContext } from 'state/swap/types'
import { DAI_INFO } from 'test-utils/constants'
import { mocked } from 'test-utils/mocked'
import { act, renderWithUniswapContext, screen } from 'test-utils/render'
import { DAI } from 'uniswap/src/constants/tokens'
import { SwapTab } from 'uniswap/src/types/screens/interface'

const mockMultichainContextValue = {
  reset: vi.fn(),
  setSelectedChainId: vi.fn(),
  setIsUserSelectedToken: vi.fn(),
  isSwapAndLimitContext: true,
  isUserSelectedToken: false,
  isMultichainContext: true,
}

const mockSwapAndLimitContextValue = {
  currencyState: {
    inputCurrency: DAI,
    outputCurrency: undefined,
  },
  setCurrencyState: vi.fn(),
  currentTab: SwapTab.Limit,
  setCurrentTab: vi.fn(),
}

const mockedSendContextDefault: SendContextType = {
  sendState: {
    exactAmountToken: undefined,
    exactAmountFiat: '',
    recipient: '',
    inputCurrency: DAI,
    inputInFiat: true,
  },
  derivedSendInfo: {},
  setSendState: vi.fn(),
}

const mockedSendContextFiatInput: SendContextType = {
  sendState: {
    exactAmountToken: undefined,
    exactAmountFiat: '1000',
    recipient: '',
    inputCurrency: DAI,
    inputInFiat: true,
  },
  derivedSendInfo: {
    exactAmountOut: '100',
  },
  setSendState: vi.fn(),
}

const mockedSendContextTokenInput: SendContextType = {
  sendState: {
    exactAmountToken: '1',
    exactAmountFiat: undefined,
    recipient: '',
    inputCurrency: DAI,
    inputInFiat: false,
  },
  derivedSendInfo: {
    exactAmountOut: '100',
  },
  setSendState: vi.fn(),
}

describe('SendCurrencyInputform', () => {
  beforeEach(() => {
    mocked(useCurrencyInfo).mockImplementation(() => {
      return DAI_INFO
    })
  })

  it('should render placeholder values', async () => {
    const { container } = await act(() =>
      renderWithUniswapContext(
        <MultichainContext.Provider value={mockMultichainContextValue}>
          <SwapAndLimitContext.Provider value={mockSwapAndLimitContextValue}>
            <SendContext.Provider value={mockedSendContextDefault}>
              <SendCurrencyInputForm />
            </SendContext.Provider>
          </SwapAndLimitContext.Provider>
        </MultichainContext.Provider>,
      ),
    )

    expect(screen.getByPlaceholderText('0')).toBeVisible()
    expect(screen.getByText('0 DAI')).toBeVisible()
    expect(screen.getByText('DAI')).toBeVisible()
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders input in fiat correctly', async () => {
    const { container } = await act(() =>
      renderWithUniswapContext(
        <MultichainContext.Provider value={mockMultichainContextValue}>
          <SwapAndLimitContext.Provider value={mockSwapAndLimitContextValue}>
            <SendContext.Provider value={mockedSendContextFiatInput}>
              <SendCurrencyInputForm />
            </SendContext.Provider>
          </SwapAndLimitContext.Provider>
        </MultichainContext.Provider>,
      ),
    )

    expect(screen.getByDisplayValue('1000')).toBeVisible()
    expect(screen.getByText('100.00 DAI')).toBeVisible()
    expect(screen.getByText('DAI')).toBeVisible()
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders input in token amount correctly', async () => {
    const { container } = await act(() =>
      renderWithUniswapContext(
        <MultichainContext.Provider value={mockMultichainContextValue}>
          <SwapAndLimitContext.Provider value={mockSwapAndLimitContextValue}>
            <SendContext.Provider value={mockedSendContextTokenInput}>
              <SendCurrencyInputForm />
            </SendContext.Provider>
          </SwapAndLimitContext.Provider>
        </MultichainContext.Provider>,
      ),
    )

    expect(screen.getByDisplayValue('1')).toBeVisible()
    expect(screen.getByText('$100.00')).toBeVisible()
    expect(screen.getByText('DAI')).toBeVisible()
    expect(container.firstChild).toMatchSnapshot()
  })
})
