jest.mock('hooks/Tokens')

import { useCurrencyInfo } from 'hooks/Tokens'
import SendCurrencyInputForm from 'pages/Swap/Send/SendCurrencyInputForm'
import { MultichainContext } from 'state/multichain/types'
import { SendContext, SendContextType } from 'state/send/SendContext'
import { SwapAndLimitContext } from 'state/swap/types'
import { DAI_INFO } from 'test-utils/constants'
import { mocked } from 'test-utils/mocked'
import { render, screen, waitFor } from 'test-utils/render'
import { DAI } from 'uniswap/src/constants/tokens'
import { SwapTab } from 'uniswap/src/types/screens/interface'

const mockMultichainContextValue = {
  reset: jest.fn(),
  setSelectedChainId: jest.fn(),
  setIsUserSelectedToken: jest.fn(),
  isSwapAndLimitContext: true,
  isUserSelectedToken: false,
  isMultichainContext: true,
}

const mockSwapAndLimitContextValue = {
  currencyState: {
    inputCurrency: DAI,
    outputCurrency: undefined,
  },
  setCurrencyState: jest.fn(),
  currentTab: SwapTab.Limit,
  setCurrentTab: jest.fn(),
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
  setSendState: jest.fn(),
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
  setSendState: jest.fn(),
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
  setSendState: jest.fn(),
}

describe('SendCurrencyInputform', () => {
  beforeEach(() => {
    mocked(useCurrencyInfo).mockImplementation(() => {
      return DAI_INFO
    })
  })

  it('should render placeholder values', async () => {
    const { container } = render(
      <MultichainContext.Provider value={mockMultichainContextValue}>
        <SwapAndLimitContext.Provider value={mockSwapAndLimitContextValue}>
          <SendContext.Provider value={mockedSendContextDefault}>
            <SendCurrencyInputForm />
          </SendContext.Provider>
        </SwapAndLimitContext.Provider>
      </MultichainContext.Provider>,
    )
    expect(await screen.getByPlaceholderText('0')).toBeVisible()
    expect(screen.getByText('0 DAI')).toBeVisible()
    expect(screen.getByText('DAI')).toBeVisible()
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders input in fiat correctly', async () => {
    const { container } = render(
      <MultichainContext.Provider value={mockMultichainContextValue}>
        <SwapAndLimitContext.Provider value={mockSwapAndLimitContextValue}>
          <SendContext.Provider value={mockedSendContextFiatInput}>
            <SendCurrencyInputForm />
          </SendContext.Provider>
        </SwapAndLimitContext.Provider>
      </MultichainContext.Provider>,
    )
    await waitFor(() => {
      expect(screen.getByDisplayValue('1000')).toBeVisible()
    })
    expect(screen.getByText('100.00 DAI')).toBeVisible()
    expect(screen.getByText('DAI')).toBeVisible()
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders input in token amount correctly', async () => {
    const { container } = render(
      <MultichainContext.Provider value={mockMultichainContextValue}>
        <SwapAndLimitContext.Provider value={mockSwapAndLimitContextValue}>
          <SendContext.Provider value={mockedSendContextTokenInput}>
            <SendCurrencyInputForm />
          </SendContext.Provider>
        </SwapAndLimitContext.Provider>
      </MultichainContext.Provider>,
    )
    await waitFor(() => {
      expect(screen.getByDisplayValue('1')).toBeVisible()
    })
    expect(screen.getByText('$100.00 USD')).toBeVisible()
    expect(screen.getByText('DAI')).toBeVisible()
    expect(container.firstChild).toMatchSnapshot()
  })
})
