import 'test-utils/tokens/mocks'

import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { SendReviewModalInner } from 'pages/Swap/Send/SendReviewModal'
import { MultichainContext } from 'state/multichain/types'
import { SendContext, SendContextType } from 'state/send/SendContext'
import { SwapAndLimitContext } from 'state/swap/types'
import { render, screen } from 'test-utils/render'
import { DAI } from 'uniswap/src/constants/tokens'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { shortenAddress } from 'utilities/src/addresses'

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

const mockedSendContextFiatInput: SendContextType = {
  sendState: {
    exactAmountToken: undefined,
    exactAmountFiat: '1000',
    recipient: 'hayden.eth',
    inputCurrency: DAI,
    inputInFiat: true,
  },
  derivedSendInfo: {
    exactAmountOut: '100',
    parsedTokenAmount: tryParseCurrencyAmount('100', DAI),
    recipientData: {
      address: '0x9984b4b4E408e8D618A879e5315BD30952c89103',
      ensName: 'hayden.eth',
    },
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
    parsedTokenAmount: tryParseCurrencyAmount('1', DAI),
    recipientData: {
      address: '0x9984b4b4E408e8D618A879e5315BD30952c89103',
      ensName: 'hayden.eth',
    },
  },
  setSendState: jest.fn(),
}

describe('SendReviewModal', () => {
  it('should render input in fiat correctly', () => {
    render(
      <MultichainContext.Provider value={mockMultichainContextValue}>
        <SwapAndLimitContext.Provider value={mockSwapAndLimitContextValue}>
          <SendContext.Provider value={mockedSendContextFiatInput}>
            <SendReviewModalInner onDismiss={jest.fn()} onConfirm={jest.fn()} />
          </SendContext.Provider>
        </SwapAndLimitContext.Provider>
      </MultichainContext.Provider>,
    )
    expect(screen.getByText('$1,000.00')).toBeVisible()
    expect(screen.getByText('100.00 DAI')).toBeVisible()
    expect(screen.getByText('hayden.eth')).toBeVisible()
    expect(screen.getByText(shortenAddress('0x9984b4b4E408e8D618A879e5315BD30952c89103'))).toBeVisible()
    const modalComponent = screen.getByTestId('send-review-modal')
    expect(modalComponent).toMatchSnapshot()
  })

  it('should render input in token amount correctly', () => {
    render(
      <MultichainContext.Provider value={mockMultichainContextValue}>
        <SwapAndLimitContext.Provider value={mockSwapAndLimitContextValue}>
          <SendContext.Provider value={mockedSendContextTokenInput}>
            <SendReviewModalInner onDismiss={jest.fn()} onConfirm={jest.fn()} />
          </SendContext.Provider>
        </SwapAndLimitContext.Provider>
      </MultichainContext.Provider>,
    )
    expect(screen.getByText('$100.00')).toBeVisible()
    expect(screen.getByText('1.00 DAI')).toBeVisible()
    expect(screen.getByText('hayden.eth')).toBeVisible()
    expect(screen.getByText(shortenAddress('0x9984b4b4E408e8D618A879e5315BD30952c89103'))).toBeVisible()
    const modalComponent = screen.getByTestId('send-review-modal')
    expect(modalComponent).toMatchSnapshot()
  })
})
