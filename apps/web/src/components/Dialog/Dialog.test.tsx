import '@testing-library/jest-dom'
import { Dialog } from 'components/Dialog/Dialog'
import { fireEvent, render, screen } from 'test-utils/render'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

const mockOnClose = jest.fn()
const mockPrimaryClick = jest.fn()
const mockSecondaryClick = jest.fn()

describe('Dialog component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const renderDialog = (props = {}) => {
    return render(
      <Dialog
        isOpen={true}
        onClose={mockOnClose}
        icon={<>Mock Icon</>}
        title="Mock Title"
        subtext="Mock Subtext"
        modalName={ModalName.Dialog}
        primaryButtonText="Primary Button"
        primaryButtonOnClick={mockPrimaryClick}
        secondaryButtonText="Close"
        secondaryButtonOnClick={mockOnClose}
        {...props}
      />,
    )
  }

  it('renders with required props', () => {
    renderDialog()

    expect(screen.getByText('Mock Icon')).toBeInTheDocument()
    expect(screen.getByText('Mock Title')).toBeInTheDocument()
    expect(screen.getByText('Mock Subtext')).toBeInTheDocument()
    expect(screen.getByText('Primary Button')).toBeInTheDocument()
  })

  it('handles close button click', () => {
    renderDialog()
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('handles primary button click', () => {
    renderDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Primary Button' }))
    expect(mockPrimaryClick).toHaveBeenCalled()
  })

  it('handles secondary button click when provided', () => {
    renderDialog({
      secondaryButtonText: 'Secondary Button',
      secondaryButtonOnClick: mockSecondaryClick,
    })

    fireEvent.click(screen.getByRole('button', { name: 'Secondary Button' }))
    expect(mockSecondaryClick).toHaveBeenCalled()
  })

  it('does not render secondary button when not provided', () => {
    renderDialog({ secondaryButtonText: undefined })
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
  })

  it('renders with left text alignment', () => {
    renderDialog({ textAlign: 'left' })
    const subtext = screen.getByText('Mock Subtext')
    expect(subtext).toHaveClass('_textAlign-left')
  })

  it('renders with icon background', () => {
    renderDialog({ hasIconBackground: true })
    expect(screen.getByTestId('dialog-icon')).toBeInTheDocument()
  })

  it('renders help CTA', () => {
    renderDialog({ displayHelpCTA: true })
    expect(screen.getByText('Get help')).toBeInTheDocument()
  })

  it('renders children content when provided', () => {
    const childContent = <div data-testid="custom-content">Custom Content</div>
    renderDialog({ children: childContent })
    expect(screen.getByTestId('custom-content')).toBeInTheDocument()
  })

  it('renders ReactNode title and subtext', () => {
    const customTitle = <span data-testid="custom-title">Custom Title</span>
    const customSubtext = <span data-testid="custom-subtext">Custom Subtext</span>

    renderDialog({
      title: customTitle,
      subtext: customSubtext,
    })

    expect(screen.getByTestId('custom-title')).toBeInTheDocument()
    expect(screen.getByTestId('custom-subtext')).toBeInTheDocument()
  })
})
