import { SwapTab } from 'components/swap/constants'
import { DAI } from 'constants/tokens'
import { SendContext, SendContextType } from 'state/send/SendContext'
import { SwapAndLimitContext } from 'state/swap/SwapContext'
import { render, screen, waitFor } from 'test-utils/render'
import SendCurrencyInputForm from './SendCurrencyInputForm'

const mockSwapAndLimitContextValue = {
  currencyState: {
    inputCurrency: DAI,
    outputCurrency: undefined,
  },
  prefilledState: {},
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
  it('should render placeholder values', async () => {
    const { container } = render(
      <SwapAndLimitContext.Provider value={mockSwapAndLimitContextValue}>
        <SendContext.Provider value={mockedSendContextDefault}>
          <SendCurrencyInputForm />
        </SendContext.Provider>
      </SwapAndLimitContext.Provider>
    )
    expect(await screen.getByPlaceholderText('0')).toBeVisible()
    expect(screen.getByText('0 DAI')).toBeVisible()
    expect(screen.getByText('DAI')).toBeVisible()
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders input in fiat correctly', async () => {
    const { container } = render(
      <SwapAndLimitContext.Provider value={mockSwapAndLimitContextValue}>
        <SendContext.Provider value={mockedSendContextFiatInput}>
          <SendCurrencyInputForm />
        </SendContext.Provider>
      </SwapAndLimitContext.Provider>
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
      <SwapAndLimitContext.Provider value={mockSwapAndLimitContextValue}>
        <SendContext.Provider value={mockedSendContextTokenInput}>
          <SendCurrencyInputForm />
        </SendContext.Provider>
      </SwapAndLimitContext.Provider>
    )
    await waitFor(() => {
      expect(screen.getByDisplayValue('1')).toBeVisible()
    })
    expect(screen.getByText('$100.00 USD')).toBeVisible()
    expect(screen.getByText('DAI')).toBeVisible()
    expect(container.firstChild).toMatchSnapshot()
  })
})
