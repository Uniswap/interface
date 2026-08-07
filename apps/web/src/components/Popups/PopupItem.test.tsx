import { PopupItem } from '~/components/Popups/PopupItem'
import { PopupType } from '~/state/popups/types'
import { render, screen } from '~/test-utils/render'

describe('PopupItem', () => {
  it('renders the transient "Try again" cancel-broadcast-failure surface', () => {
    // The cancel sagas surface a failed/aborted broadcast as this error popup — the record
    // itself is reverted (web) or left alerted (Revert), so the popup is the only feedback
    const { container } = render(
      <PopupItem
        content={{ type: PopupType.Error, error: 'Your cancellation wasn’t submitted. Try again.' }}
        popKey="cancel-broadcast-failed-order-1"
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText('Your cancellation wasn’t submitted. Try again.')).toBeInTheDocument()
    expect(container).toMatchSnapshot()
  })
})
