import { SwapTab } from 'components/swap/constants'
import { DAI } from 'constants/tokens'
import { SendContext, SendContextType } from 'state/send/SendContext'
import { SwapAndLimitContext } from 'state/swap/SwapContext'
import { render, screen } from 'test-utils/render'
import { shortenAddress } from 'utilities/src/addresses'
import { SendRecipientForm } from './SendRecipientForm'

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

const mockedSendContextRecipientInput: SendContextType = {
  sendState: {
    exactAmountToken: undefined,
    exactAmountFiat: '',
    recipient: 'hayden.eth',
    inputCurrency: DAI,
    inputInFiat: true,
  },
  derivedSendInfo: {},
  setSendState: jest.fn(),
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
  setSendState: jest.fn(),
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
  setSendState: jest.fn(),
}

describe('SendCurrencyInputform', () => {
  it('should render placeholder values', () => {
    const { container } = render(
      <SwapAndLimitContext.Provider value={mockSwapAndLimitContextValue}>
        <SendContext.Provider value={mockedSendContextDefault}>
          <SendRecipientForm />
        </SendContext.Provider>
      </SwapAndLimitContext.Provider>
    )
    expect(screen.getByPlaceholderText('Wallet address or ENS name')).toBeVisible()
    expect(container.firstChild).toMatchSnapshot()
  })

  it('should render correctly with no verified recipient', () => {
    const { container } = render(
      <SwapAndLimitContext.Provider value={mockSwapAndLimitContextValue}>
        <SendContext.Provider value={mockedSendContextRecipientInput}>
          <SendRecipientForm />
        </SendContext.Provider>
      </SwapAndLimitContext.Provider>
    )
    expect(screen.getByDisplayValue('hayden.eth')).toBeVisible()
    expect(container.firstChild).toMatchSnapshot()
  })

  it('should render correctly with verified recipient', () => {
    const { container } = render(
      <SwapAndLimitContext.Provider value={mockSwapAndLimitContextValue}>
        <SendContext.Provider value={mockedSendContextWithVerifiedRecipientInput}>
          <SendRecipientForm />
        </SendContext.Provider>
      </SwapAndLimitContext.Provider>
    )
    expect(screen.getByText('hayden.eth')).toBeVisible()
    expect(screen.getByText(shortenAddress('0x9984b4b4E408e8D618A879e5315BD30952c89103'))).toBeVisible()
    expect(container.firstChild).toMatchSnapshot()
  })

  it('should render correctly with unitag', () => {
    const { container } = render(
      <SwapAndLimitContext.Provider value={mockSwapAndLimitContextValue}>
        <SendContext.Provider value={mockedSendContextWithUnitag}>
          <SendRecipientForm />
        </SendContext.Provider>
      </SwapAndLimitContext.Provider>
    )
    expect(screen.getByText('hayden')).toBeVisible()
    expect(screen.getByText(shortenAddress('0x9984b4b4E408e8D618A879e5315BD30952c89103'))).toBeVisible()
    expect(container.firstChild).toMatchSnapshot()
  })
})
