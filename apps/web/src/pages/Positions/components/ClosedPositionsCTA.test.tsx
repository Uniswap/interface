import userEvent from '@testing-library/user-event'
import { ClosedPositionsCTA } from '~/pages/Positions/components/ClosedPositionsCTA'
import { render, screen } from '~/test-utils/render'

describe('ClosedPositionsCTA', () => {
  it('renders nothing when show is false', () => {
    render(<ClosedPositionsCTA show={false} />)

    expect(screen.queryByText('Looking for your closed positions?')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders the title and description when show is true', () => {
    render(<ClosedPositionsCTA show={true} />)

    expect(screen.getByText('Looking for your closed positions?')).toBeInTheDocument()
    expect(screen.getByText('You can see them by using the filter at the top of the page.')).toBeInTheDocument()
  })

  it('hides itself after the close button is pressed', async () => {
    const user = userEvent.setup()
    render(<ClosedPositionsCTA show={true} />)

    expect(screen.getByText('Looking for your closed positions?')).toBeInTheDocument()

    await user.click(screen.getByRole('button'))

    expect(screen.queryByText('Looking for your closed positions?')).not.toBeInTheDocument()
  })

  it('dismiss persists when parent re-renders with show=true', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<ClosedPositionsCTA show={true} />)

    await user.click(screen.getByRole('button'))
    expect(screen.queryByText('Looking for your closed positions?')).not.toBeInTheDocument()

    rerender(<ClosedPositionsCTA show={true} />)

    expect(screen.queryByText('Looking for your closed positions?')).not.toBeInTheDocument()
  })
})
