import { sendAnalyticsEvent } from '@uniswap/analytics'
import { TEST_ALLOWED_SLIPPAGE, TEST_TRADE_EXACT_INPUT, TEST_TRADE_EXACT_OUTPUT } from 'test-utils/constants'
import { render, screen, within } from 'test-utils/render'

import SwapModalFooter from './SwapModalFooter'

jest.mock('@uniswap/analytics')
const mockSendAnalyticsEvent = sendAnalyticsEvent as jest.MockedFunction<typeof sendAnalyticsEvent>

describe('SwapModalFooter.tsx', () => {
  let sendAnalyticsEventMock: jest.Mock<any, any>

  beforeAll(() => {
    sendAnalyticsEventMock = jest.fn()
  })

  it('matches base snapshot, test trade exact input', () => {
    const { asFragment } = render(
      <SwapModalFooter
        trade={TEST_TRADE_EXACT_INPUT}
        allowedSlippage={TEST_ALLOWED_SLIPPAGE}
        hash={undefined}
        onConfirm={jest.fn()}
        disabledConfirm={false}
        swapQuoteReceivedDate={undefined}
        fiatValueInput={{
          data: undefined,
          isLoading: false,
        }}
        fiatValueOutput={{
          data: undefined,
          isLoading: false,
        }}
        shouldLogModalCloseEvent={false}
        setShouldLogModalCloseEvent={jest.fn()}
        showAcceptChanges={false}
        onAcceptChanges={jest.fn()}
      />
    )
    expect(asFragment()).toMatchSnapshot()

    expect(
      screen.getByText(
        'The minimum amount you are guaranteed to receive. If the price slips any further, your transaction will revert.'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText('The fee paid to miners who process your transaction. This must be paid in ETH.')
    ).toBeInTheDocument()
    expect(screen.getByText('The impact your trade has on the market price of this pool.')).toBeInTheDocument()
  })

  it('shows accept changes section when available, and logs amplitude event when accept clicked', () => {
    const setShouldLogModalCloseEventFn = jest.fn()
    const mockAcceptChanges = jest.fn()
    mockSendAnalyticsEvent.mockImplementation(sendAnalyticsEventMock)
    render(
      <SwapModalFooter
        trade={TEST_TRADE_EXACT_INPUT}
        allowedSlippage={TEST_ALLOWED_SLIPPAGE}
        hash={undefined}
        onConfirm={jest.fn()}
        disabledConfirm={false}
        swapQuoteReceivedDate={undefined}
        fiatValueInput={{
          data: undefined,
          isLoading: false,
        }}
        fiatValueOutput={{
          data: undefined,
          isLoading: false,
        }}
        shouldLogModalCloseEvent={true}
        setShouldLogModalCloseEvent={setShouldLogModalCloseEventFn}
        showAcceptChanges={true}
        onAcceptChanges={mockAcceptChanges}
      />
    )
    expect(setShouldLogModalCloseEventFn).toHaveBeenCalledWith(false)
    const showAcceptChanges = screen.getByTestId('show-accept-changes')
    expect(showAcceptChanges).toBeInTheDocument()
    expect(within(showAcceptChanges).getByText('Price updated')).toBeVisible()
    expect(within(showAcceptChanges).getByText('Accept')).toBeVisible()
    expect(sendAnalyticsEventMock).toHaveBeenCalledTimes(1)
  })

  it('test trade exact output, no recipient', () => {
    render(
      <SwapModalFooter
        trade={TEST_TRADE_EXACT_OUTPUT}
        allowedSlippage={TEST_ALLOWED_SLIPPAGE}
        hash={undefined}
        onConfirm={jest.fn()}
        disabledConfirm={false}
        swapQuoteReceivedDate={undefined}
        fiatValueInput={{
          data: undefined,
          isLoading: false,
        }}
        fiatValueOutput={{
          data: undefined,
          isLoading: false,
        }}
        shouldLogModalCloseEvent={true}
        setShouldLogModalCloseEvent={jest.fn()}
        showAcceptChanges={true}
        onAcceptChanges={jest.fn()}
      />
    )
    expect(
      screen.getByText(
        'The maximum amount you are guaranteed to spend. If the price slips any further, your transaction will revert.'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText('The fee paid to miners who process your transaction. This must be paid in ETH.')
    ).toBeInTheDocument()
    expect(screen.getByText('The impact your trade has on the market price of this pool.')).toBeInTheDocument()
  })
})
