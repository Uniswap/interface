import { SendRecipientForm } from 'pages/Swap/Send/SendRecipientForm'
import { MultichainContext } from 'state/multichain/types'
import { SendContext, SendContextType } from 'state/send/SendContext'
import { SwapAndLimitContext } from 'state/swap/types'
import { render, screen } from 'test-utils/render'
import { DAI } from 'uniswap/src/constants/tokens'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { shortenAddress } from 'utilities/src/addresses'

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

const mockedSendContextRecipientInput: SendContextType = {
  sendState: {
    exactAmountToken: undefined,
    exactAmountFiat: '',
    recipient: 'hayden.eth',
    inputCurrency: DAI,
    inputInFiat: true,
  },
  derivedSendInfo: {},
  setSendState: vi.fn(),
}

const mockedSendContextWithVerifiedRecipientInput: SendContextType = {
  sendState: {
    exactAmountToken: '1',
    exactAmountFiat: undefined,
    recipient: 'hayden.eth',
    inputCurrency: DAI,
    inputInFiat: false,
    validatedRecipientData: {
      address: '0x9984b4b4E408e8D618A879e5315BD30952c89103',
      ensName: 'hayden.eth',
    },
  },
  derivedSendInfo: {
    recipientData: {
      address: '0x9984b4b4E408e8D618A879e5315BD30952c89103',
      ensName: 'hayden.eth',
    },
  },
  setSendState: vi.fn(),
}

const mockedSendContextWithUnitag: SendContextType = {
  sendState: {
    exactAmountToken: '1',
    exactAmountFiat: undefined,
    recipient: 'hayden.eth',
    inputCurrency: DAI,
    inputInFiat: false,
    validatedRecipientData: {
      address: '0x9984b4b4E408e8D618A879e5315BD30952c89103',
      ensName: 'hayden.eth',
    },
  },
  derivedSendInfo: {
    recipientData: {
      address: '0x9984b4b4E408e8D618A879e5315BD30952c89103',
      ensName: 'hayden.eth',
      unitag: 'hayden',
    },
  },
  setSendState: vi.fn(),
}

describe('SendCurrencyInputform', () => {
  it('should render placeholder values', () => {
    const { container } = render(
      <MultichainContext.Provider value={mockMultichainContextValue}>
        <SwapAndLimitContext.Provider value={mockSwapAndLimitContextValue}>
          <SendContext.Provider value={mockedSendContextDefault}>
            <SendRecipientForm />
          </SendContext.Provider>
        </SwapAndLimitContext.Provider>
      </MultichainContext.Provider>,
    )
    expect(screen.getByPlaceholderText('Wallet address or ENS name')).toBeVisible()
    expect(container.firstChild).toMatchSnapshot()
  })

  it('should render correctly with no verified recipient', () => {
    const { container } = render(
      <MultichainContext.Provider value={mockMultichainContextValue}>
        <SwapAndLimitContext.Provider value={mockSwapAndLimitContextValue}>
          <SendContext.Provider value={mockedSendContextRecipientInput}>
            <SendRecipientForm />
          </SendContext.Provider>
        </SwapAndLimitContext.Provider>
      </MultichainContext.Provider>,
    )
    expect(screen.getByDisplayValue('hayden.eth')).toBeVisible()
    expect(container.firstChild).toMatchSnapshot()
  })

  it('should render correctly with verified recipient', () => {
    const { container } = render(
      <MultichainContext.Provider value={mockMultichainContextValue}>
        <SwapAndLimitContext.Provider value={mockSwapAndLimitContextValue}>
          <SendContext.Provider value={mockedSendContextWithVerifiedRecipientInput}>
            <SendRecipientForm />
          </SendContext.Provider>
        </SwapAndLimitContext.Provider>
      </MultichainContext.Provider>,
    )
    expect(screen.getByText('hayden.eth')).toBeVisible()
    expect(screen.getByText(shortenAddress({ address: '0x9984b4b4E408e8D618A879e5315BD30952c89103' }))).toBeVisible()
    expect(container.firstChild).toMatchSnapshot()
  })

  it('should render correctly with unitag', () => {
    const { container } = render(
      <MultichainContext.Provider value={mockMultichainContextValue}>
        <SwapAndLimitContext.Provider value={mockSwapAndLimitContextValue}>
          <SendContext.Provider value={mockedSendContextWithUnitag}>
            <SendRecipientForm />
          </SendContext.Provider>
        </SwapAndLimitContext.Provider>
      </MultichainContext.Provider>,
    )
    expect(screen.getByText('hayden')).toBeVisible()
    expect(screen.getByText(shortenAddress({ address: '0x9984b4b4E408e8D618A879e5315BD30952c89103' }))).toBeVisible()
    expect(container.firstChild).toMatchSnapshot()
  })
})
