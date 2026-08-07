import { CreatePositionErrorCallout } from '~/pages/CreatePosition/CreatePositionErrorCallout'
import { useCreatePositionTxContext } from '~/pages/CreatePosition/CreatePositionTxContext'
import { render, screen } from '~/test-utils/render'

vi.mock('~/pages/CreatePosition/CreatePositionTxContext', () => ({
  useCreatePositionTxContext: vi.fn(),
}))

const mockContext = (overrides: Partial<ReturnType<typeof useCreatePositionTxContext>>) => {
  vi.mocked(useCreatePositionTxContext).mockReturnValue({
    transactionError: false,
    hookRejectsLiquidity: false,
    ...overrides,
  } as ReturnType<typeof useCreatePositionTxContext>)
}

describe('CreatePositionErrorCallout', () => {
  it('renders the transaction error', () => {
    mockContext({ transactionError: 'KYC_REQUIRED, id: 2a5e8b59' })
    render(<CreatePositionErrorCallout />)
    expect(screen.getByText(/KYC_REQUIRED/)).toBeInTheDocument()
  })

  it('should hide the error while the verify-identity gate carries the message', () => {
    // Repro for ECO-609: the deposit step rendered the raw backend rejection alongside the
    // Verify identity CTA; the gate is the message, so the callout must be suppressed.
    mockContext({ transactionError: 'KYC_REQUIRED, id: 2a5e8b59' })
    render(<CreatePositionErrorCallout suppressed />)
    expect(screen.queryByText(/KYC_REQUIRED/)).not.toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })
})
