import '~/test-utils/tokens/mocks'
import { Error, PendingModalError } from '~/pages/Swap/Limit/ConfirmSwapModal/Error'
import { LIMIT_ORDER_TRADE } from '~/test-utils/constants'
import { render, screen } from '~/test-utils/render'

describe('ConfirmSwapModal/Error', () => {
  it('renders nothing when errorType is omitted', () => {
    render(<Error onRetry={vi.fn()} />)
    expect(screen.queryByTestId('pending-modal-failure-icon')).not.toBeInTheDocument()
  })

  it.each([
    ['limit order', PendingModalError.PERMIT_ERROR, LIMIT_ORDER_TRADE, 'Permit approval failed'],
    ['limit order', PendingModalError.TOKEN_APPROVAL_ERROR, LIMIT_ORDER_TRADE, 'Token approval failed'],
    ['limit order', PendingModalError.CONFIRMATION_ERROR, LIMIT_ORDER_TRADE, 'Limit failed'],
    ['limit order', PendingModalError.XV2_HARD_QUOTE_ERROR, LIMIT_ORDER_TRADE, 'Limit failed'],
    ['limit order', PendingModalError.WRAP_ERROR, LIMIT_ORDER_TRADE, 'Wrap failed'],
  ])('renders %p correctly, with error= %p', async (_, errorType, trade, expectedError) => {
    render(<Error errorType={errorType} trade={trade} onRetry={vi.fn()} showTrade={true} />)
    expect(screen.getByText(expectedError)).toBeInTheDocument()
  })
})
