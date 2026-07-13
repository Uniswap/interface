import { DAI } from 'uniswap/src/constants/tokens'
import * as useRecentTransfersByAddress from 'uniswap/src/features/send/useRecentTransfersByAddress'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { shortenAddress } from 'utilities/src/addresses'
import { SwapAndLimitContext } from '~/features/Swap/state/types'
import { SendRecipientForm } from '~/pages/Swap/Send/SendRecipientForm'
import { SendContext, SendContextType } from '~/pages/Swap/Send/state/SendContext'
import { MultichainContext } from '~/state/multichain/types'
import { act, fireEvent, render, screen, waitFor } from '~/test-utils/render'

vi.mock('uniswap/src/features/ens/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/ens/api')>()
  return {
    ...actual,
    useENSName: vi.fn(() => ({ data: undefined, isLoading: false })),
    useENSAvatar: vi.fn(() => ({ data: undefined, isLoading: false })),
  }
})

vi.mock('uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery', () => ({
  useUnitagsAddressQuery: vi.fn(() => ({ data: undefined, isLoading: false })),
  useUnitagsAddressesQuery: vi.fn(() => ({ data: undefined, isLoading: false })),
}))

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
      unitag: 'hayden',
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

describe('SendRecipientForm', () => {
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
    render(
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
  })

  it('should blur recipient input when clicking outside', async () => {
    // With an empty recipient, the flyout only opens when there are recent transfers; dismissal (and blur)
    // runs from controlled Popover `onOpenChange(false)`, which does not fire if the popover never opened.
    const groupedSpy = vi.spyOn(useRecentTransfersByAddress, 'useRecentTransfersByAddress').mockReturnValue({
      transfers: [{ address: '0x1111111111111111111111111111111111111111', count: 1 }],
      loading: false,
    })
    try {
      render(
        <MultichainContext.Provider value={mockMultichainContextValue}>
          <SwapAndLimitContext.Provider value={mockSwapAndLimitContextValue}>
            <SendContext.Provider value={mockedSendContextDefault}>
              <SendRecipientForm />
            </SendContext.Provider>
          </SwapAndLimitContext.Provider>
        </MultichainContext.Provider>,
      )

      const input = screen.getByPlaceholderText('Wallet address or ENS name')
      act(() => {
        input.focus()
      })
      expect(input).toHaveFocus()

      act(() => {
        fireEvent.mouseDown(document.body)
      })

      await waitFor(() => {
        expect(input).not.toHaveFocus()
      })
    } finally {
      groupedSpy.mockRestore()
    }
  })
})
