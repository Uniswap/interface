import { sendAnalyticsEvent } from '@uniswap/analytics'
import {
  noop,
  testAllowedSlippage,
  testRecipientAddress,
  testTradeExactInput,
  testTradeExactOutput,
} from 'test-utils/constants'
import { render, screen, within } from 'test-utils/render'

import SwapModalHeader from './SwapModalHeader'

jest.mock('@web3-react/core', () => {
  const web3React = jest.requireActual('@web3-react/core')
  return {
    ...web3React,
    useWeb3React: () => ({
      chainId: 1,
    }),
  }
})

jest.mock('@uniswap/analytics')
const mockSendAnalyticsEvent = sendAnalyticsEvent as jest.MockedFunction<typeof sendAnalyticsEvent>

describe('SwapModalHeader.tsx', () => {
  let sendAnalyticsEventMock: jest.Mock<any, any>

  beforeAll(() => {
    sendAnalyticsEventMock = jest.fn()
  })

  it('matches base snapshot, test trade exact input', () => {
    const { asFragment } = render(
      <SwapModalHeader
        trade={testTradeExactInput}
        allowedSlippage={testAllowedSlippage}
        shouldLogModalCloseEvent={false}
        showAcceptChanges={false}
        setShouldLogModalCloseEvent={noop}
        onAcceptChanges={noop}
        recipient={testRecipientAddress}
      />
    )
    expect(asFragment()).toMatchSnapshot()
    expect(screen.getByText(/Output is estimated. You will receive at least /i)).toBeInTheDocument()
    expect(screen.getByTestId('input-symbol')).toHaveTextContent('ABC')
    expect(screen.getByTestId('output-symbol')).toHaveTextContent('DEF')
    expect(screen.getByTestId('input-amount')).toHaveTextContent('0.000000000000001')
    expect(screen.getByTestId('output-amount')).toHaveTextContent('0.000000000000001')
    const recipientInfo = screen.getByTestId('recipient-info')
    expect(recipientInfo).toHaveTextContent(/Output will be sent to/i)
    expect(within(recipientInfo).getByText('0x0fF2...F4a5')).toBeVisible()
    expect(
      screen.getByText(
        'The minimum amount you are guaranteed to receive. If the price slips any further, your transaction will revert.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText(/The amount you expect to receive at the current market price./i)).toBeInTheDocument()
    expect(screen.getByText('The impact your trade has on the market price of this pool.')).toBeInTheDocument()
  })

  it('shows accept changes section when available, and logs amplitude event when accept clicked', () => {
    const setShouldLogModalCloseEventFn = jest.fn()
    mockSendAnalyticsEvent.mockImplementation(sendAnalyticsEventMock)
    render(
      <SwapModalHeader
        trade={testTradeExactInput}
        allowedSlippage={testAllowedSlippage}
        shouldLogModalCloseEvent
        showAcceptChanges
        setShouldLogModalCloseEvent={setShouldLogModalCloseEventFn}
        onAcceptChanges={noop}
        recipient={testRecipientAddress}
      />
    )
    expect(setShouldLogModalCloseEventFn).toHaveBeenCalledWith(false)
    const showAcceptChanges = screen.getByTestId('show-accept-changes')
    expect(showAcceptChanges).toBeInTheDocument()
    expect(within(showAcceptChanges).getByText('Price Updated')).toBeVisible()
    expect(within(showAcceptChanges).getByText('Accept')).toBeVisible()
    expect(sendAnalyticsEventMock).toHaveBeenCalledTimes(1)
  })

  it('test trade exact output, no recipient', () => {
    const rendered = render(
      <SwapModalHeader
        trade={testTradeExactOutput}
        allowedSlippage={testAllowedSlippage}
        shouldLogModalCloseEvent={false}
        showAcceptChanges={false}
        setShouldLogModalCloseEvent={noop}
        onAcceptChanges={noop}
        recipient={null}
      />
    )
    expect(rendered.queryByTestId('recipient-info')).toBeNull()
    expect(screen.getByText(/Input is estimated. You will sell at most/i)).toBeInTheDocument()
    expect(screen.getByTestId('input-symbol')).toHaveTextContent('ABC')
    expect(screen.getByTestId('output-symbol')).toHaveTextContent('GHI')
    expect(screen.getByTestId('input-amount')).toHaveTextContent('0.000000000000001')
    expect(screen.getByTestId('output-amount')).toHaveTextContent('0.000000000000001')
  })
})
