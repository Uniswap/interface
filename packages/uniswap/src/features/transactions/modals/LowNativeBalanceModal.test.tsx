import { fireEvent, screen } from '@testing-library/react'
import { TestID } from '@universe/test'
import { LowNativeBalanceModal } from 'uniswap/src/features/transactions/modals/LowNativeBalanceModal'
import { renderWithProviders } from 'uniswap/src/test/render'

// The bottom sheet needs native modal context jsdom can't provide; the modal content is what's under test.
vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children, isModalOpen }: { children: React.ReactNode; isModalOpen: boolean }): JSX.Element | null =>
    isModalOpen ? <>{children}</> : null,
}))

function renderModal(): { onAcknowledge: ReturnType<typeof vi.fn>; hasDismissed: () => boolean | undefined } {
  const onAcknowledge = vi.fn()
  const { store } = renderWithProviders(
    <LowNativeBalanceModal isOpen onClose={vi.fn()} onAcknowledge={onAcknowledge} />,
  )
  return {
    onAcknowledge,
    hasDismissed: () => store.getState().uniswapBehaviorHistory.hasDismissedLowNetworkTokenWarning,
  }
}

// On device the row's TouchableArea is an RNGH native button, and RN-core pressables nested inside it
// (the checkbox and the label) never receive the touch, so only a press on the row itself reaches JS.
function pressDontShowAgainRow(): void {
  const row = screen.getByRole('checkbox').closest('[role="button"]')
  if (!row) {
    throw new Error('"Don\'t show again" row not rendered')
  }
  fireEvent.click(row)
}

function isCheckboxChecked(): boolean {
  return screen.getByRole('checkbox').getAttribute('aria-checked') === 'true'
}

describe(LowNativeBalanceModal, () => {
  it('toggles "Don\'t show again" from a press on the row', () => {
    renderModal()
    expect(isCheckboxChecked()).toBe(false)

    pressDontShowAgainRow()
    expect(isCheckboxChecked()).toBe(true)

    pressDontShowAgainRow()
    expect(isCheckboxChecked()).toBe(false)
  })

  it('toggles "Don\'t show again" from a press on the label', () => {
    renderModal()

    fireEvent.click(screen.getByText('common.dontShowAgain'))
    expect(isCheckboxChecked()).toBe(true)
  })

  it('persists the dismissal when continuing with "Don\'t show again" selected', () => {
    const { onAcknowledge, hasDismissed } = renderModal()

    pressDontShowAgainRow()
    fireEvent.click(screen.getByTestId(TestID.Confirm))

    expect(hasDismissed()).toBe(true)
    expect(onAcknowledge).toHaveBeenCalledTimes(1)
  })

  it('does not persist the dismissal when continuing without selecting "Don\'t show again"', () => {
    const { onAcknowledge, hasDismissed } = renderModal()

    fireEvent.click(screen.getByTestId(TestID.Confirm))

    expect(hasDismissed()).toBe(false)
    expect(onAcknowledge).toHaveBeenCalledTimes(1)
  })

  it('selects "Don\'t show again" exactly once when the checkbox itself is pressed', () => {
    const { hasDismissed } = renderModal()

    fireEvent.click(screen.getByRole('checkbox'))
    expect(isCheckboxChecked()).toBe(true)

    fireEvent.click(screen.getByTestId(TestID.Confirm))
    expect(hasDismissed()).toBe(true)
  })
})
