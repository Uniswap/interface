import { TimeCell } from '~/pages/Portfolio/Activity/ActivityTable/TimeCell'
import { render, screen } from '~/test-utils/render'

// Mid-bucket, so the age reads "3h" even though the shared clock is floored to the second.
const THREE_HOURS_AGO_MS = Date.now() - 3.5 * 60 * 60 * 1000

describe('TimeCell', () => {
  it('renders no abbreviated stand-in outside a collapsible column', () => {
    render(<TimeCell timestamp={THREE_HOURS_AGO_MS} />)

    expect(screen.queryByText('3h')).toBeNull()
  })

  it('renders the abbreviated time as a visual-only stand-in in a collapsible column', () => {
    render(<TimeCell timestamp={THREE_HOURS_AGO_MS} collapsible />)

    expect(screen.getByText('3h').parentElement).toHaveAttribute('aria-hidden', 'true')
  })
})
