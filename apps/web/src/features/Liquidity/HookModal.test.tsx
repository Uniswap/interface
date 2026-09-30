import { fireEvent } from '@testing-library/react'
import { HookModal } from '~/features/Liquidity/HookModal'
import { render, screen } from '~/test-utils/render'

// The real Modal is a Radix dialog / bottom sheet; render straight through like the other modal specs.
vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children, isModalOpen }: { children: React.ReactNode; isModalOpen: boolean }) =>
    isModalOpen ? <div>{children}</div> : null,
}))

// Last two hex bytes carry the v4 permission flags: 0x0080 = beforeSwap (informational only),
// 0x0200 = beforeRemoveLiquidity (dangerous — can trap funds).
const SWAP_HOOK = '0x1111111111111111111111111111111111110080'
const REMOVE_LIQUIDITY_HOOK = '0x1111111111111111111111111111111111110200'

function renderModal(props?: Partial<React.ComponentProps<typeof HookModal>>): {
  onClose: ReturnType<typeof vi.fn>
  onCancel: ReturnType<typeof vi.fn>
  onContinue: ReturnType<typeof vi.fn>
} {
  const handlers = { onClose: vi.fn(), onCancel: vi.fn(), onContinue: vi.fn() }
  render(<HookModal isOpen address={SWAP_HOOK} {...handlers} {...props} />)
  return handlers
}

describe('HookModal', () => {
  it('describes adding the hook and offers to remove it', () => {
    renderModal()

    expect(screen.getByText('Adding hook')).toBeInTheDocument()
    expect(screen.getByText('Remove hook')).toBeInTheDocument()
  })

  // Closing is the caller's job for both decisions: the add-liquidity route derives `isOpen` from the
  // recorded approval and its `onClose` leaves the page, so firing it after Continue would bounce the
  // user out of the pool they just accepted.
  it('reports Continue without also closing', () => {
    const { onContinue, onClose } = renderModal()

    fireEvent.click(screen.getByText('Continue'))

    expect(onContinue).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('reports Remove hook without also closing', () => {
    const { onCancel, onClose } = renderModal()

    fireEvent.click(screen.getByText('Remove hook'))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('blocks Continue on a dangerous hook until the disclaimer is acknowledged', () => {
    const { onContinue } = renderModal({ address: REMOVE_LIQUIDITY_HOOK })

    expect(screen.getByText('Important: hook risks identified')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Continue'))
    expect(onContinue).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByText('Continue'))
    expect(onContinue).toHaveBeenCalledTimes(1)
  })
})
