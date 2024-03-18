import { LIMIT_ORDER_TRADE, TEST_TRADE_EXACT_INPUT } from 'test-utils/constants'
import { render, screen } from 'test-utils/render'

import Error, { PendingModalError } from './Error'

describe('ConfirmSwapModal/Error', () => {
  it.each([
    ['classic trade', PendingModalError.CONFIRMATION_ERROR, TEST_TRADE_EXACT_INPUT, 'Swap failed'],
    ['classic trade', PendingModalError.PERMIT_ERROR, TEST_TRADE_EXACT_INPUT, 'Permit approval failed'],
    ['classic trade', PendingModalError.TOKEN_APPROVAL_ERROR, TEST_TRADE_EXACT_INPUT, 'Token approval failed'],
    ['classic trade', PendingModalError.WRAP_ERROR, TEST_TRADE_EXACT_INPUT, 'Wrap failed'],
    ['limit order', PendingModalError.CONFIRMATION_ERROR, LIMIT_ORDER_TRADE, 'Limit failed'],
    ['limit order', PendingModalError.WRAP_ERROR, LIMIT_ORDER_TRADE, 'Wrap failed'],
  ])('renders %p correctly, with error= %p', async (testCaseName, errorType, trade, expectedError) => {
    const { asFragment } = render(<Error errorType={errorType} trade={trade} onRetry={jest.fn()} />)
    expect(asFragment()).toMatchSnapshot()
    expect(screen.getByText(expectedError)).toBeInTheDocument()
  })
})
