import { sendAnalyticsEvent } from '@uniswap/analytics'
import { noop, testAllowedSlippage, testRecipientAddress, testTrade } from 'test-utils/constants'
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

  it('matches base snapshot', () => {
    const { asFragment } = render(
      <SwapModalHeader
        trade={testTrade}
        allowedSlippage={testAllowedSlippage}
        shouldLogModalCloseEvent={false}
        showAcceptChanges={false}
        setShouldLogModalCloseEvent={noop}
        onAcceptChanges={noop}
        recipient={testRecipientAddress}
      />
    )
    expect(asFragment()).toMatchSnapshot()
  })

  it('shows accept changes section when available, and logs amplitude event when accept clicked', () => {
    const setShouldLogModalCloseEventFn = jest.fn()
    mockSendAnalyticsEvent.mockImplementation(sendAnalyticsEventMock)
    render(
      <SwapModalHeader
        trade={testTrade}
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
})
