import { sendAnalyticsEvent } from '@uniswap/analytics'
import {
  TEST_ALLOWED_SLIPPAGE,
  TEST_RECIPIENT_ADDRESS,
  TEST_TRADE_EXACT_INPUT,
  TEST_TRADE_EXACT_OUTPUT,
} from 'test-utils/constants'
import { render, screen, within } from 'test-utils/render'
import noop from 'utils/noop'

import SwapModalHeader from './SwapModalHeader'

jest.mock('@uniswap/analytics')
const mockSendAnalyticsEvent = sendAnalyticsEvent as jest.MockedFunction<typeof sendAnalyticsEvent>

describe('SwapModalHeader.tsx', () => {
  let sendAnalyticsEventMock: jest.Mock<any, any>

  beforeAll(() => {
    sendAnalyticsEventMock = jest.fn()
  })

  it('matches base snapshot for test trade with exact input', () => {
    const { asFragment } = render(
      <SwapModalHeader
        trade={TEST_TRADE_EXACT_INPUT}
        allowedSlippage={TEST_ALLOWED_SLIPPAGE}
        shouldLogModalCloseEvent={false}
        showAcceptChanges={false}
        setShouldLogModalCloseEvent={noop}
        onAcceptChanges={noop}
        recipient={TEST_RECIPIENT_ADDRESS}
      />
    )
    expect(asFragment()).toMatchSnapshot()
  })

  it('shows accept changes section and logs amplitude event', () => {
    const setShouldLogModalCloseEventFn = jest.fn()
    mockSendAnalyticsEvent.mockImplementation(sendAnalyticsEventMock)
    render(
      <SwapModalHeader
        trade={TEST_TRADE_EXACT_INPUT}
        allowedSlippage={TEST_ALLOWED_SLIPPAGE}
        shouldLogModalCloseEvent
        showAcceptChanges
        setShouldLogModalCloseEvent={setShouldLogModalCloseEventFn}
        onAcceptChanges={noop}
        recipient={TEST_RECIPIENT_ADDRESS}
      />
    )
    expect(setShouldLogModalCloseEventFn).toHaveBeenCalledWith(false)
    const showAcceptChanges = screen.getByTestId('show-accept-changes')
    expect(showAcceptChanges).toBeInTheDocument()
    expect(within(showAcceptChanges).getByText('Price Updated')).toBeVisible()
    expect(within(showAcceptChanges).getByText('Accept')).toBeVisible()
    expect(sendAnalyticsEventMock).toHaveBeenCalledTimes(1)
  })

  it('renders correctly for test trade with exact output and no recipient', () => {
    const rendered = render(
      <SwapModalHeader
        trade={TEST_TRADE_EXACT_OUTPUT}
        allowedSlippage={TEST_ALLOWED_SLIPPAGE}
        shouldLogModalCloseEvent={false}
        showAcceptChanges={false}
        setShouldLogModalCloseEvent={noop}
        onAcceptChanges={noop}
        recipient={null}
      />
    )
    expect(rendered.queryByTestId('recipient-info')).toBeNull()
    expect(screen.getByText(/Input is estimated. You will sell at most/i)).toBeInTheDocument()
    expect(screen.getByTestId('input-symbol')).toHaveTextContent(
      TEST_TRADE_EXACT_OUTPUT.inputAmount.currency.symbol ?? ''
    )
    expect(screen.getByTestId('output-symbol')).toHaveTextContent(
      TEST_TRADE_EXACT_OUTPUT.outputAmount.currency.symbol ?? ''
    )
    expect(screen.getByTestId('input-amount')).toHaveTextContent(TEST_TRADE_EXACT_OUTPUT.inputAmount.toExact())
    expect(screen.getByTestId('output-amount')).toHaveTextContent(TEST_TRADE_EXACT_OUTPUT.outputAmount.toExact())
  })
})
